// localStorage-backed store for encrypted file blobs.
// Unlike IndexedDB, localStorage is synchronous and reliably shared
// across all tabs on the same origin — so decrypt links work in new tabs.

export interface FileRecord {
  id: string;
  fileName: string;
  fileSize: number;
  encryptedBase64: string;   // base64-encoded encrypted data
  expiry: string;
  downloadLimit: string;
  downloadsUsed: number;
  createdAt: number;
}

const PREFIX = 'gbox_file_';

function fileKey(id: string): string {
  return PREFIX + id;
}

/** Generate a short random ID */
export function generateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const arr = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(arr)
    .map((b) => chars[b % chars.length])
    .join('');
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  // Process in chunks to avoid call stack overflow on large arrays
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  return btoa(binary);
}

function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Save an encrypted file record */
export function saveFile(record: {
  id: string;
  fileName: string;
  fileSize: number;
  encryptedData: Uint8Array;
  expiry: string;
  downloadLimit: string;
  downloadsUsed: number;
  createdAt: number;
}): void {
  const stored: FileRecord = {
    id: record.id,
    fileName: record.fileName,
    fileSize: record.fileSize,
    encryptedBase64: uint8ToBase64(record.encryptedData),
    expiry: record.expiry,
    downloadLimit: record.downloadLimit,
    downloadsUsed: record.downloadsUsed,
    createdAt: record.createdAt,
  };
  try {
    localStorage.setItem(fileKey(record.id), JSON.stringify(stored));
  } catch (e) {
    console.error('Failed to save file to localStorage:', e);
    throw new Error('Storage quota exceeded. Try a smaller file.');
  }
}

/** Get a file record by ID. Returns null if not found, expired, or download limit reached. */
export function getFile(id: string): {
  fileName: string;
  fileSize: number;
  encryptedData: Uint8Array;
  expiry: string;
  downloadLimit: string;
  downloadsUsed: number;
  createdAt: number;
} | null {
  const raw = localStorage.getItem(fileKey(id));
  if (!raw) return null;

  let record: FileRecord;
  try {
    record = JSON.parse(raw);
  } catch {
    return null;
  }

  // Check expiry
  const expiryMs: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };
  const ttl = expiryMs[record.expiry] ?? expiryMs['24h'];
  if (Date.now() - record.createdAt > ttl) {
    deleteFile(id);
    return null;
  }

  // Check download limit
  if (record.downloadLimit !== 'unlimited') {
    const limit = parseInt(record.downloadLimit, 10);
    if (record.downloadsUsed >= limit) {
      deleteFile(id);
      return null;
    }
  }

  return {
    fileName: record.fileName,
    fileSize: record.fileSize,
    encryptedData: base64ToUint8(record.encryptedBase64),
    expiry: record.expiry,
    downloadLimit: record.downloadLimit,
    downloadsUsed: record.downloadsUsed,
    createdAt: record.createdAt,
  };
}

/** Increment download count for a file. Auto-deletes if limit reached. */
export function incrementDownloads(id: string): void {
  const raw = localStorage.getItem(fileKey(id));
  if (!raw) return;

  try {
    const record: FileRecord = JSON.parse(raw);
    record.downloadsUsed += 1;

    if (record.downloadLimit !== 'unlimited') {
      const limit = parseInt(record.downloadLimit, 10);
      if (record.downloadsUsed >= limit) {
        deleteFile(id);
        return;
      }
    }

    localStorage.setItem(fileKey(id), JSON.stringify(record));
  } catch { /* ignore */ }
}

/** Delete a file record */
export function deleteFile(id: string): void {
  localStorage.removeItem(fileKey(id));
}
