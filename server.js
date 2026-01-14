require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

// Configure AWS S3 (or Backblaze B2 with S3-compatible API)
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  // For Backblaze B2, add:
  // endpoint: process.env.B2_ENDPOINT
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

// In-memory metadata store (use Redis or MongoDB in production)
const fileMetadata = new Map();

// Multer for handling file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 * 1024 } // 5GB max
});

// Upload encrypted file
app.post('/api/upload', upload.single('encryptedFile'), async (req, res) => {
  try {
    const fileId = 'gb_' + uuidv4();
    const { fileName, fileSize, expiration, downloadLimit } = req.body;
    
    // Upload to S3
    await s3.upload({
      Bucket: BUCKET_NAME,
      Key: fileId,
      Body: req.file.buffer,
      ContentType: 'application/octet-stream'
    }).promise();
    
    // Store metadata
    fileMetadata.set(fileId, {
      id: fileId,
      name: fileName,
      size: parseInt(fileSize),
      expiration: parseInt(expiration),
      downloadLimit: parseInt(downloadLimit),
      downloadsUsed: 0,
      createdAt: Date.now()
    });
    
    res.json({ success: true, fileId });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get file metadata
app.get('/api/file/:fileId/metadata', (req, res) => {
  const { fileId } = req.params;
  const metadata = fileMetadata.get(fileId);
  
  if (!metadata) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  // Check expiration
  const expiresAt = metadata.createdAt + (metadata.expiration * 60 * 60 * 1000);
  if (Date.now() > expiresAt) {
    fileMetadata.delete(fileId);
    return res.status(404).json({ error: 'File expired' });
  }
  
  // Check download limit
  if (metadata.downloadLimit > 0 && metadata.downloadsUsed >= metadata.downloadLimit) {
    return res.status(404).json({ error: 'Download limit reached' });
  }
  
  res.json(metadata);
});

// Download encrypted file
app.get('/api/file/:fileId/download', async (req, res) => {
  const { fileId } = req.params;
  const metadata = fileMetadata.get(fileId);
  
  if (!metadata) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  try {
    const s3Object = await s3.getObject({
      Bucket: BUCKET_NAME,
      Key: fileId
    }).promise();
    
    // Increment download count
    metadata.downloadsUsed++;
    
    // Delete if limit reached
    if (metadata.downloadLimit > 0 && metadata.downloadsUsed >= metadata.downloadLimit) {
      await s3.deleteObject({ Bucket: BUCKET_NAME, Key: fileId }).promise();
      fileMetadata.delete(fileId);
    }
    
    res.set('Content-Type', 'application/octet-stream');
    res.send(s3Object.Body);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// Cleanup expired files (run periodically)
setInterval(() => {
  const now = Date.now();
  for (const [fileId, metadata] of fileMetadata.entries()) {
    const expiresAt = metadata.createdAt + (metadata.expiration * 60 * 60 * 1000);
    if (now > expiresAt) {
      s3.deleteObject({ Bucket: BUCKET_NAME, Key: fileId }).promise();
      fileMetadata.delete(fileId);
      console.log(`Deleted expired file: ${fileId}`);
    }
  }
}, 60000); // Check every minute

// 1. ADD THIS SPECIFICALLY
app.get('/', (req, res) => {
  res.send('GuardianBox API is Active');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`GuardianBox server running on port ${PORT}`);

});
