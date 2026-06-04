import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Lock,
  Download,
  Check,
  AlertTriangle,
  ArrowLeft,
  FileText,
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { getFile, incrementDownloads } from '../lib/fileStore';
import { decryptFile } from '../lib/crypto';

interface DecryptPageProps {
  fileId: string;
  passwordFromHash: string;
  onBack: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

type Status = 'loading' | 'ready' | 'need-password' | 'decrypting' | 'done' | 'error' | 'not-found';

export default function DecryptPage({ fileId, passwordFromHash, onBack }: DecryptPageProps) {
  const [status, setStatus] = useState<Status>('loading');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [expiry, setExpiry] = useState('');
  const [downloadLimit, setDownloadLimit] = useState('');
  const [downloadsUsed, setDownloadsUsed] = useState(0);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [manualPassword, setManualPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [encryptedData, setEncryptedData] = useState<Uint8Array | null>(null);
  const [downloadUrl, setDownloadUrl] = useState('');

  // Load file from localStorage (synchronous, works across tabs on same origin)
  useEffect(() => {
    const record = getFile(fileId);

    if (!record) {
      setStatus('not-found');
      return;
    }

    setFileName(record.fileName);
    setFileSize(record.fileSize);
    setExpiry(record.expiry);
    setDownloadLimit(record.downloadLimit);
    setDownloadsUsed(record.downloadsUsed);
    setEncryptedData(record.encryptedData);

    setStatus(passwordFromHash ? 'ready' : 'need-password');
  }, [fileId, passwordFromHash]);

  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  const doDecrypt = useCallback(async (pwd: string) => {
    if (!encryptedData) {
      setStatus('error');
      setErrorMsg('No encrypted data found.');
      return;
    }

    setStatus('decrypting');
    setProgress(0);

    try {
      const plaintext = await decryptFile(encryptedData, pwd, setProgress);

      const blob = new Blob([plaintext]);
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      try {
        incrementDownloads(fileId);
      } catch (e) {
        console.warn('Failed to increment download count:', e);
      }
      setDownloadsUsed((prev) => prev + 1);

      setStatus('done');
    } catch (err) {
      console.error('Decryption failed:', err);
      setStatus('error');
      setErrorMsg(
        'Decryption failed. The password is likely incorrect — make sure you have the exact password used during encryption.'
      );
    }
  }, [encryptedData, fileId]);

  const handleDecryptClick = () => {
    const pwd = passwordFromHash || manualPassword;
    if (!pwd) return;
    doDecrypt(pwd);
  };

  const expiryLabel: Record<string, string> = {
    '1h': '1 Hour',
    '24h': '24 Hours',
    '7d': '7 Days',
    '30d': '30 Days',
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-50" />
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-guardian-600/8 blur-[120px]" />
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-vault-500/6 blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <button onClick={onBack} className="inline-flex items-center gap-2.5 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-guardian-500 to-guardian-700 shadow-lg shadow-guardian-500/25">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">
              Guardian<span className="text-guardian-400">Box</span>
            </span>
          </button>
          <p className="text-sm text-dark-300">End-to-End Encrypted File Sharing</p>
        </div>

        <div className="glass rounded-2xl p-8 border border-guardian-500/20">

          {status === 'loading' && (
            <div className="text-center py-8">
              <Loader2 className="w-10 h-10 text-guardian-400 animate-spin mx-auto mb-4" />
              <p className="text-sm text-dark-200">Loading encrypted file...</p>
            </div>
          )}

          {status === 'not-found' && (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-amber-500/15 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">File Not Found</h3>
              <p className="text-sm text-dark-300 mb-3 max-w-xs mx-auto">
                This file may have expired, reached its download limit, or the link is invalid.
              </p>
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-guardian-600 to-guardian-500 text-white hover:from-guardian-500 hover:to-guardian-400 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Go to Home
              </button>
            </div>
          )}

          {status === 'need-password' && (
            <div className="py-2">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-dark-700/50 mb-6">
                <div className="w-10 h-10 rounded-lg bg-guardian-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-guardian-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{fileName}</p>
                  <p className="text-xs text-dark-300">{formatFileSize(fileSize)}</p>
                </div>
                <Lock className="w-4 h-4 text-vault-400" />
              </div>

              <div className="mb-6">
                <label className="flex items-center gap-2 text-sm font-medium text-white mb-3">
                  <KeyRound className="w-4 h-4 text-guardian-400" />
                  Enter Decryption Password
                </label>
                <p className="text-xs text-dark-400 mb-3">
                  The password was not found in the link. Ask the sender for the password.
                </p>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={manualPassword}
                    onChange={(e) => setManualPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && manualPassword) handleDecryptClick(); }}
                    placeholder="Enter password..."
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-dark-500 text-white placeholder-dark-400 text-sm focus:outline-none focus:border-guardian-500 focus:ring-1 focus:ring-guardian-500/30 transition-all pr-12"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleDecryptClick}
                disabled={!manualPassword}
                className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  manualPassword
                    ? 'bg-gradient-to-r from-guardian-600 to-guardian-500 text-white hover:from-guardian-500 hover:to-guardian-400 shadow-lg shadow-guardian-600/25'
                    : 'bg-dark-600 text-dark-400 cursor-not-allowed'
                }`}
              >
                <Lock className="w-4 h-4" />
                Decrypt &amp; Download
              </button>
            </div>
          )}

          {status === 'ready' && (
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-full bg-guardian-500/15 flex items-center justify-center mx-auto mb-5">
                <Lock className="w-7 h-7 text-guardian-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Encrypted File Ready</h3>
              <p className="text-sm text-dark-300 mb-6">Click below to decrypt and download.</p>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-dark-700/50 mb-4 text-left">
                <div className="w-10 h-10 rounded-lg bg-guardian-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-guardian-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{fileName}</p>
                  <p className="text-xs text-dark-300">{formatFileSize(fileSize)}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="p-2.5 rounded-lg bg-dark-700/30 text-center">
                  <p className="text-[10px] text-dark-400 uppercase">Expires</p>
                  <p className="text-xs font-semibold text-white">{expiryLabel[expiry] ?? expiry}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-dark-700/30 text-center">
                  <p className="text-[10px] text-dark-400 uppercase">Downloads</p>
                  <p className="text-xs font-semibold text-white">
                    {downloadLimit === 'unlimited' ? 'Unlimited' : `${downloadsUsed}/${downloadLimit}`}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-dark-700/30 text-center">
                  <p className="text-[10px] text-dark-400 uppercase">Encryption</p>
                  <p className="text-xs font-semibold text-vault-400">AES-256</p>
                </div>
              </div>

              <button
                onClick={handleDecryptClick}
                className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-guardian-600 to-guardian-500 text-white hover:from-guardian-500 hover:to-guardian-400 shadow-lg shadow-guardian-600/25 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Decrypt &amp; Download
              </button>

              <p className="text-xs text-dark-400 mt-3 flex items-center justify-center gap-1">
                <Shield className="w-3 h-3 text-vault-500" />
                Decrypted entirely in your browser.
              </p>
            </div>
          )}

          {status === 'decrypting' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-guardian-500/20 flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
                <Lock className="w-8 h-8 text-guardian-400 animate-pulse" />
              </div>
              <p className="text-lg font-semibold text-white mb-1">Decrypting...</p>
              <p className="text-sm text-dark-300 mb-1">{fileName}</p>
              <p className="text-xs text-dark-400 mb-6 font-mono">AES-256-GCM • PBKDF2</p>
              <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-guardian-500 to-vault-400 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-dark-400 mt-2 font-mono">{Math.round(progress)}%</p>
            </div>
          )}

          {status === 'done' && downloadUrl && (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-vault-500/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7 text-vault-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Decryption Complete!</h3>
              <p className="text-sm text-dark-300 mb-6">Your file is ready. Click the button below to save it.</p>

              <a
                href={downloadUrl}
                download={fileName}
                className="w-full py-3.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-vault-600 to-vault-500 text-white hover:from-vault-500 hover:to-vault-400 shadow-lg shadow-vault-600/30 transition-all flex items-center justify-center gap-2 mb-4"
              >
                <Download className="w-5 h-5" />
                Save File — {fileName}
              </a>

              <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="p-2.5 rounded-lg bg-dark-700/30 text-center">
                  <p className="text-[10px] text-dark-400 uppercase">File Size</p>
                  <p className="text-xs font-semibold text-white">{formatFileSize(fileSize)}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-dark-700/30 text-center">
                  <p className="text-[10px] text-dark-400 uppercase">Encryption</p>
                  <p className="text-xs font-semibold text-vault-400">AES-256-GCM</p>
                </div>
                <div className="p-2.5 rounded-lg bg-dark-700/30 text-center">
                  <p className="text-[10px] text-dark-400 uppercase">Status</p>
                  <p className="text-xs font-semibold text-vault-400">Decrypted ✓</p>
                </div>
              </div>

              <button
                onClick={onBack}
                className="px-5 py-2.5 rounded-xl text-sm font-medium glass-light text-dark-200 hover:text-white transition-all flex items-center justify-center gap-2 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Decryption Failed</h3>
              <p className="text-sm text-dark-300 mb-6 max-w-xs mx-auto">{errorMsg}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => {
                    setErrorMsg('');
                    setManualPassword('');
                    setStatus(encryptedData ? 'need-password' : 'loading');
                  }}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium glass-light text-dark-200 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  Try Another Password
                </button>
                <button
                  onClick={onBack}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-guardian-600 to-guardian-500 text-white hover:from-guardian-500 hover:to-guardian-400 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go to Home
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-dark-400 mt-6 flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3 text-vault-500" />
          Protected by AES-256-GCM • Zero-Knowledge Architecture
        </p>
      </motion.div>
    </div>
  );
}
