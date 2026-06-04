import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Lock,
  Link2,
  Check,
  FileText,
  FileImage,
  FileArchive,
  FileSpreadsheet,
  FileVideo,
  X,
  Clock,
  Download,
  Copy,
  Shield,
  Eye,
  EyeOff,
  ExternalLink,
  Crown,
  AlertTriangle,
} from 'lucide-react';
import { encryptFile } from '../lib/crypto';
import { saveFile, generateId, getFile } from '../lib/fileStore';
import { getSession } from '../lib/userStore';
import {
  PLAN_LIMITS,
  ALL_EXPIRIES,
  formatMB,
  type Plan,
} from '../lib/planLimits';
import { getUsageSnapshot, recordUpload } from '../lib/userStore';

type Step = 'upload' | 'password' | 'options' | 'encrypting' | 'complete';
type DemoTab = 'upload' | 'decrypt';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext))
    return FileImage;
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return FileArchive;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return FileSpreadsheet;
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return FileVideo;
  return FileText;
}

function DecryptInput({ embedded = false }: { embedded?: boolean }) {
  const [decryptCode, setDecryptCode] = useState('');
  const [decryptError, setDecryptError] = useState('');

  const handleDecrypt = () => {
    setDecryptError('');
    const trimmed = decryptCode.trim();
    if (!trimmed) return;

    // Try to parse as a full URL with #decrypt/
    let fileId = '';
    let pwd = '';

    // Format 1: full URL — extract hash
    const hashMatch = trimmed.match(/#decrypt\/([^/]+)\/(.+)$/);
    if (hashMatch) {
      fileId = hashMatch[1];
      pwd = decodeURIComponent(hashMatch[2]);
    }

    // Format 2: just the hash part — #decrypt/id/password
    if (!fileId) {
      const directMatch = trimmed.match(/^#?decrypt\/([^/]+)\/(.+)$/);
      if (directMatch) {
        fileId = directMatch[1];
        pwd = decodeURIComponent(directMatch[2]);
      }
    }

    // Format 3: just id/password
    if (!fileId) {
      const simpleMatch = trimmed.match(/^([a-z0-9]{6,12})\/(.+)$/);
      if (simpleMatch) {
        fileId = simpleMatch[1];
        pwd = decodeURIComponent(simpleMatch[2]);
      }
    }

    if (!fileId || !pwd) {
      setDecryptError('Invalid link. Paste the full decrypt link or use the format: fileId/password');
      return;
    }

    // Check if the file exists in localStorage before navigating
    const file = getFile(fileId);
    if (!file) {
      setDecryptError('File not found. It may have expired or been downloaded already.');
      return;
    }

    window.location.hash = `decrypt/${fileId}/${encodeURIComponent(pwd)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={embedded ? 'p-0' : 'mt-10 glass rounded-2xl p-6 border border-dark-500/30 max-w-2xl mx-auto'}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-vault-500/15 flex items-center justify-center">
          <Download className="w-4 h-4 text-vault-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Decrypt a Received File</h3>
          <p className="text-xs text-dark-400">Paste the link you received to decrypt and download</p>
        </div>
      </div>

      {decryptError && (
        <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {decryptError}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={decryptCode}
          onChange={(e) => { setDecryptCode(e.target.value); setDecryptError(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleDecrypt(); }}
          placeholder="Paste decrypt link here..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-dark-800 border border-dark-500 text-white placeholder-dark-400 text-sm focus:outline-none focus:border-vault-500 focus:ring-1 focus:ring-vault-500/30 transition-all font-mono"
        />
        <button
          onClick={handleDecrypt}
          disabled={!decryptCode.trim()}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all ${
            decryptCode.trim()
              ? 'bg-vault-600 text-white hover:bg-vault-500 shadow-lg shadow-vault-600/20'
              : 'bg-dark-600 text-dark-400 cursor-not-allowed'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          Decrypt
        </button>
      </div>
    </motion.div>
  );
}

export default function DemoUpload() {
  const [activeTab, setActiveTab] = useState<DemoTab>('upload');
  const [step, setStep] = useState<Step>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [fileSizeBytes, setFileSizeBytes] = useState(0);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [expiry, setExpiry] = useState('24h');
  const [downloadLimit, setDownloadLimit] = useState('unlimited');
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [encryptError, setEncryptError] = useState('');
  const [limitError, setLimitError] = useState<string | null>(null);
  const [usageTick, setUsageTick] = useState(0); // re-reads usage on upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  // Resolve current user + plan
  const session = useMemo(() => getSession(), [usageTick]);
  const plan: Plan = session?.plan ?? 'free';
  const limits = PLAN_LIMITS[plan];
  const usage = useMemo(
    () => (session ? getUsageSnapshot(session.email) : { filesToday: 0, bandwidthTodayMB: 0, activeFiles: 0 }),
    [session, usageTick]
  );

  const goToUpgrade = () => {
    window.location.hash = 'pay/pro';
  };

  // Refresh session view whenever navigation happens (e.g., after payment)
  useEffect(() => {
    const onHash = () => setUsageTick((t) => t + 1);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Sanitize expiry/download-limit when plan changes
  if (!limits.allowedExpiries.includes(expiry)) {
    setExpiry(limits.allowedExpiries[limits.allowedExpiries.length - 1]);
  }
  if (!limits.allowedDownloadLimits.includes(downloadLimit)) {
    setDownloadLimit(limits.allowedDownloadLimits[limits.allowedDownloadLimits.length - 1]);
  }

  const processFile = useCallback((f: File) => {
    // Re-read limits each time (in case plan changed)
    const currentSession = getSession();
    const currentPlan: Plan = currentSession?.plan ?? 'free';
    const currentLimits = PLAN_LIMITS[currentPlan];
    const currentUsage = currentSession ? getUsageSnapshot(currentSession.email) : { filesToday: 0, bandwidthTodayMB: 0, activeFiles: 0 };
    const sizeMB = f.size / (1024 * 1024);

    // 1. File size limit
    if (sizeMB > currentLimits.maxFileSizeMB) {
      setLimitError(
        `This file is ${formatFileSize(f.size)} — your ${currentLimits.name} plan allows up to ${formatMB(currentLimits.maxFileSizeMB)} per file. Upgrade to share larger files.`
      );
      setStep('upload');
      return;
    }
    // 2. Daily upload cap
    if (currentUsage.filesToday >= currentLimits.dailyUploadCap) {
      setLimitError(
        `You've used all ${currentLimits.dailyUploadCap} uploads allowed today on the ${currentLimits.name} plan. Upgrade to Pro for unlimited uploads.`
      );
      setStep('upload');
      return;
    }
    // 3. Daily bandwidth cap
    if (currentUsage.bandwidthTodayMB + sizeMB > currentLimits.dailyBandwidthMB) {
      setLimitError(
        `Uploading this file would exceed your ${formatMB(currentLimits.dailyBandwidthMB)}/day bandwidth limit on the ${currentLimits.name} plan. Upgrade to Pro for unlimited bandwidth.`
      );
      setStep('upload');
      return;
    }
    // 4. Active files cap
    if (currentUsage.activeFiles >= currentLimits.maxActiveFiles) {
      setLimitError(
        `You have ${currentLimits.maxActiveFiles} active shared ${currentLimits.maxActiveFiles === 1 ? 'link' : 'links'} on the ${currentLimits.name} plan. Wait for one to expire or upgrade to Pro.`
      );
      setStep('upload');
      return;
    }

    setLimitError(null);
    setFile(f);
    setFileName(f.name);
    setFileSize(formatFileSize(f.size));
    setFileSizeBytes(f.size);
    setStep('password');
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) processFile(f);
    },
    [processFile]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;
      const f = e.dataTransfer.files?.[0];
      if (f) processFile(f);
    },
    [processFile]
  );

  const handleEncrypt = () => {
    if (!password) return;
    setStep('options');
  };

  const handleGenerate = async () => {
    if (!file) return;
    setStep('encrypting');
    setProgress(0);
    setEncryptError('');

    try {
      // Read the file into an ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      setProgress(10);

      // Encrypt with real AES-256-GCM
      const encrypted = await encryptFile(arrayBuffer, password, (pct) => {
        // Map crypto progress (5-100) into our 10-90 range
        setProgress(10 + Math.round(pct * 0.8));
      });

      setProgress(92);

      // Store in IndexedDB
      const fileId = generateId();
      saveFile({
        id: fileId,
        fileName,
        fileSize: fileSizeBytes,
        encryptedData: encrypted,
        expiry,
        downloadLimit,
        downloadsUsed: 0,
        createdAt: Date.now(),
      });

      // Track usage for quota enforcement
      const session = getSession();
      if (session) {
        recordUpload(session.email, fileSizeBytes / (1024 * 1024));
        setUsageTick((t) => t + 1);
      }

      setProgress(100);

      // Build the shareable link — localStorage is shared across tabs on same origin
      const link = `${window.location.origin}${window.location.pathname}#decrypt/${fileId}/${encodeURIComponent(password)}`;
      setGeneratedLink(link);

      // Small delay for the progress bar to visually hit 100%
      await new Promise((r) => setTimeout(r, 400));
      setStep('complete');
    } catch (err) {
      console.error('Encryption failed:', err);
      setEncryptError('Encryption failed. The file may be too large for this browser.');
      setStep('options');
    }
  };

  // Extract just the hash part for in-app navigation
  const getHashFromLink = () => {
    const idx = generatedLink.indexOf('#');
    return idx !== -1 ? generatedLink.slice(idx) : '';
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenLink = () => {
    // Navigate within the same SPA — always works
    const hash = getHashFromLink();
    if (hash) window.location.hash = hash;
  };

  const reset = () => {
    setStep('upload');
    setFile(null);
    setFileName('');
    setFileSize('');
    setFileSizeBytes(0);
    setPassword('');
    setShowPassword(false);
    setExpiry('24h');
    setDownloadLimit('unlimited');
    setProgress(0);
    setCopied(false);
    setGeneratedLink('');
    setEncryptError('');
    setLimitError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const FileIcon = fileName ? getFileIcon(fileName) : FileText;

  return (
    <section id="demo" className="relative py-32 overflow-hidden">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-guardian-600/5 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold text-guardian-400 bg-guardian-500/10 border border-guardian-500/20 mb-4">
            INTERACTIVE DEMO
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-4">
            Try It{' '}
            <span className="bg-gradient-to-r from-guardian-400 to-vault-400 bg-clip-text text-transparent">
              Right Now
            </span>
          </h2>
          <p className="mt-4 text-lg text-dark-200 max-w-2xl mx-auto">
            Real encryption — select a file, set a password, get a working decryption link.
          </p>
        </motion.div>

        {/* Top Tabs */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-2xl bg-dark-800/70 border border-dark-600/50 p-1.5 shadow-lg shadow-black/20">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'upload'
                  ? 'bg-guardian-600 text-white shadow-lg shadow-guardian-600/25'
                  : 'text-dark-300 hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
            <button
              onClick={() => setActiveTab('decrypt')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'decrypt'
                  ? 'bg-vault-600 text-white shadow-lg shadow-vault-600/25'
                  : 'text-dark-300 hover:text-white'
              }`}
            >
              <Download className="w-4 h-4" />
              Decrypt
            </button>
          </div>
        </div>

        {/* Progress steps indicator */}
        {activeTab === 'upload' && (
          <div className="flex items-center justify-center gap-2 mb-10">
            {['Upload', 'Password', 'Options', 'Done'].map((label, i) => {
              const stepMap: Record<Step, number> = { upload: 0, password: 1, options: 2, encrypting: 3, complete: 3 };
              const stepIndex = stepMap[step];
              const isActive = i <= stepIndex;
              return (
                <div key={label} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isActive ? 'bg-guardian-500 text-white' : 'bg-dark-600 text-dark-300'
                    }`}
                  >
                    {i < stepIndex ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:inline ${
                      isActive ? 'text-guardian-400' : 'text-dark-400'
                    }`}
                  >
                    {label}
                  </span>
                  {i < 3 && (
                    <div className={`w-8 h-0.5 ${i < stepIndex ? 'bg-guardian-500' : 'bg-dark-600'}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Main card */}
        <motion.div
          layout
          className="glass rounded-3xl p-8 md:p-10 border border-guardian-500/20 max-w-2xl mx-auto"
        >
          <AnimatePresence mode="wait">
            {activeTab === 'decrypt' ? (
              <motion.div
                key="decrypt-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <DecryptInput embedded />
              </motion.div>
            ) : (
              <>
            {/* Step 1: Upload (or Sign-In Gate) */}
            {step === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {/* ─── Not signed in: show gate ─── */}
                {!session ? (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 rounded-2xl bg-guardian-500/10 flex items-center justify-center mx-auto mb-5">
                      <Lock className="w-8 h-8 text-guardian-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Sign in to get started</h3>
                    <p className="text-sm text-dark-300 mb-6 max-w-sm mx-auto leading-relaxed">
                      Create a free account to upload and encrypt files. No credit card required — the Free tier includes 5 uploads/day and 100 MB per file.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 max-w-xs mx-auto">
                      <button
                        onClick={() => { window.location.hash = 'signup'; }}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-guardian-600 to-guardian-500 text-white hover:from-guardian-500 hover:to-guardian-400 shadow-lg shadow-guardian-600/25 transition-all flex items-center justify-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Sign Up Free
                      </button>
                      <button
                        onClick={() => { window.location.hash = 'signin'; }}
                        className="flex-1 py-3 rounded-xl text-sm font-medium glass-light text-dark-200 hover:text-white hover:bg-white/[0.06] transition-all flex items-center justify-center gap-2"
                      >
                        Sign In
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-8">
                      <div className="p-3 rounded-xl bg-dark-700/30 text-center">
                        <p className="text-lg font-bold text-white">100 MB</p>
                        <p className="text-[10px] text-dark-400 mt-0.5">Max file size</p>
                      </div>
                      <div className="p-3 rounded-xl bg-dark-700/30 text-center">
                        <p className="text-lg font-bold text-white">5</p>
                        <p className="text-[10px] text-dark-400 mt-0.5">Uploads/day</p>
                      </div>
                      <div className="p-3 rounded-xl bg-dark-700/30 text-center">
                        <p className="text-lg font-bold text-white">24 hr</p>
                        <p className="text-[10px] text-dark-400 mt-0.5">Max storage</p>
                      </div>
                    </div>

                    <p className="text-xs text-dark-400 mt-5 flex items-center justify-center gap-1.5">
                      <Shield className="w-3 h-3 text-vault-500" />
                      AES-256-GCM encryption • Zero-knowledge architecture
                    </p>
                  </div>
                ) : (
                  /* ─── Signed in: show upload zone ─── */
                  <>
                    {/* Plan + quota bar */}
                    <div className="flex items-center justify-between mb-4 p-3 rounded-xl bg-dark-700/40 border border-dark-600/40">
                      <div className="flex items-center gap-2">
                        <Crown className={`w-4 h-4 ${plan === 'free' ? 'text-dark-400' : 'text-amber-400'}`} />
                        <span className="text-xs font-semibold text-white">{limits.name} Plan</span>
                        {plan === 'free' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-dark-600 text-dark-300 font-medium">
                            Limited
                          </span>
                        )}
                      </div>
                      <button
                        onClick={goToUpgrade}
                        className="text-[11px] font-semibold text-guardian-400 hover:text-guardian-300 transition-colors"
                      >
                        Upgrade →
                      </button>
                    </div>

                    {/* Quota indicators (Free plan only) */}
                    {plan === 'free' && (
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-dark-700/30 text-center">
                          <p className="text-[10px] text-dark-400 uppercase">Uploads</p>
                          <p className="text-xs font-semibold text-white">
                            {usage.filesToday}<span className="text-dark-400">/{limits.dailyUploadCap}</span>
                          </p>
                          <div className="mt-1 h-0.5 bg-dark-600 rounded-full overflow-hidden">
                            <div className="h-full bg-guardian-500" style={{ width: `${Math.min(100, (usage.filesToday / limits.dailyUploadCap) * 100)}%` }} />
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-dark-700/30 text-center">
                          <p className="text-[10px] text-dark-400 uppercase">Bandwidth</p>
                          <p className="text-xs font-semibold text-white">
                            {Math.round(usage.bandwidthTodayMB)}<span className="text-dark-400">/{limits.dailyBandwidthMB} MB</span>
                          </p>
                          <div className="mt-1 h-0.5 bg-dark-600 rounded-full overflow-hidden">
                            <div className="h-full bg-vault-500" style={{ width: `${Math.min(100, (usage.bandwidthTodayMB / limits.dailyBandwidthMB) * 100)}%` }} />
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-dark-700/30 text-center">
                          <p className="text-[10px] text-dark-400 uppercase">Active Links</p>
                          <p className="text-xs font-semibold text-white">
                            {usage.activeFiles}<span className="text-dark-400">/{limits.maxActiveFiles}</span>
                          </p>
                          <div className="mt-1 h-0.5 bg-dark-600 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500" style={{ width: `${Math.min(100, (usage.activeFiles / limits.maxActiveFiles) * 100)}%` }} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Limit error banner */}
                    <AnimatePresence>
                      {limitError && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-4"
                        >
                          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                            <div className="flex items-start gap-2.5">
                              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-amber-200 leading-relaxed mb-2">{limitError}</p>
                                <button
                                  onClick={goToUpgrade}
                                  className="text-xs font-semibold text-guardian-400 hover:text-guardian-300 transition-colors"
                                >
                                  Upgrade to Pro →
                                </button>
                              </div>
                              <button
                                onClick={() => setLimitError(null)}
                                className="text-amber-400/60 hover:text-amber-200 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileInput}
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragEnter={handleDragEnter}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                        isDragging
                          ? 'border-guardian-400 bg-guardian-500/10 scale-[1.02]'
                          : 'border-dark-500 hover:border-guardian-500/50 hover:bg-white/[0.02]'
                      }`}
                    >
                      <div
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all ${
                          isDragging ? 'bg-guardian-500/20 scale-110' : 'bg-guardian-500/10'
                        }`}
                      >
                        <Upload className={`w-8 h-8 transition-colors ${isDragging ? 'text-guardian-400' : 'text-dark-300'}`} />
                      </div>
                      <p className="text-lg font-semibold text-white mb-2">
                        {isDragging ? 'Release to upload' : 'Drop your file here'}
                      </p>
                      <p className="text-sm text-dark-300 mb-4">
                        or <span className="text-guardian-400 underline underline-offset-2">click to browse</span> • Max {formatMB(limits.maxFileSizeMB)}
                      </p>
                      <p className="text-xs text-dark-400">All file types supported • Encrypted before upload</p>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* Step 2: Password */}
            {step === 'password' && (
              <motion.div
                key="password"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-3 p-4 rounded-xl bg-dark-700/50 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-guardian-500/20 flex items-center justify-center">
                    <FileIcon className="w-5 h-5 text-guardian-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{fileName}</p>
                    <p className="text-xs text-dark-300">{fileSize}</p>
                  </div>
                  <button onClick={reset} className="text-dark-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mb-6">
                  <label className="flex items-center gap-2 text-sm font-medium text-white mb-3">
                    <Lock className="w-4 h-4 text-guardian-400" />
                    Set Decryption Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && password) handleEncrypt(); }}
                      placeholder="Enter a strong password..."
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
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-dark-400 flex items-center gap-1">
                      <Shield className="w-3 h-3 text-vault-500" />
                      This password is never sent to our servers.
                    </p>
                    {password && (
                      <p className="text-xs text-dark-400">
                        Strength:{' '}
                        <span className={password.length >= 12 ? 'text-vault-400 font-semibold' : password.length >= 8 ? 'text-amber-400 font-semibold' : 'text-red-400 font-semibold'}>
                          {password.length >= 12 ? 'Strong' : password.length >= 8 ? 'Medium' : 'Weak'}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleEncrypt}
                  disabled={!password}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                    password
                      ? 'bg-gradient-to-r from-guardian-600 to-guardian-500 text-white hover:from-guardian-500 hover:to-guardian-400 shadow-lg shadow-guardian-600/25'
                      : 'bg-dark-600 text-dark-400 cursor-not-allowed'
                  }`}
                >
                  Continue
                </button>
              </motion.div>
            )}

            {/* Step 3: Options */}
            {step === 'options' && (
              <motion.div
                key="options"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-700/50 mb-6">
                  <FileIcon className="w-4 h-4 text-guardian-400 shrink-0" />
                  <span className="text-xs text-dark-200 truncate">{fileName}</span>
                  <span className="text-xs text-dark-400">•</span>
                  <span className="text-xs text-dark-400">{fileSize}</span>
                  <div className="ml-auto flex items-center gap-1">
                    <Lock className="w-3 h-3 text-vault-400" />
                    <span className="text-xs text-vault-400 font-medium">Password set</span>
                  </div>
                </div>

                {encryptError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                    {encryptError}
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-white mb-3">
                      <Clock className="w-4 h-4 text-guardian-400" />
                      Link Expiration
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {ALL_EXPIRIES.map((option) => {
                        const locked = !limits.allowedExpiries.includes(option.value);
                        return (
                          <button
                            key={option.value}
                            onClick={() => {
                              if (locked) {
                                setLimitError(
                                  `The ${option.label} option requires the ${plan === 'free' ? 'Pro' : 'paid'} plan.`
                                );
                                return;
                              }
                              setExpiry(option.value);
                            }}
                            className={`relative px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                              locked
                                ? 'bg-dark-800/60 text-dark-500 border border-dark-700 cursor-not-allowed'
                                : expiry === option.value
                                ? 'bg-guardian-500/20 text-guardian-400 border border-guardian-500/40'
                                : 'bg-dark-700/50 text-dark-300 border border-dark-600 hover:border-dark-400'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1">
                              {locked && <Lock className="w-2.5 h-2.5" />}
                              {option.label}
                            </div>
                            {option.pro && (
                              <span className="absolute -top-1.5 -right-1.5 text-[8px] bg-guardian-500 text-white px-1.5 py-0.5 rounded-full font-bold">PRO</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-white mb-3">
                      <Download className="w-4 h-4 text-guardian-400" />
                      Download Limit
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: '1', label: 'One-Time' },
                        { value: '5', label: '5 Downloads' },
                        { value: 'unlimited', label: 'Unlimited', pro: true },
                      ].map((option) => {
                        const locked = !limits.allowedDownloadLimits.includes(option.value);
                        return (
                          <button
                            key={option.value}
                            onClick={() => {
                              if (locked) {
                                setLimitError('Unlimited download limit is available on the Pro plan only.');
                                return;
                              }
                              setDownloadLimit(option.value);
                            }}
                            className={`relative px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                              locked
                                ? 'bg-dark-800/60 text-dark-500 border border-dark-700 cursor-not-allowed'
                                : downloadLimit === option.value
                                ? 'bg-guardian-500/20 text-guardian-400 border border-guardian-500/40'
                                : 'bg-dark-700/50 text-dark-300 border border-dark-600 hover:border-dark-400'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1">
                              {locked && <Lock className="w-2.5 h-2.5" />}
                              {option.label}
                            </div>
                            {option.pro && (
                              <span className="absolute -top-1.5 -right-1.5 text-[8px] bg-guardian-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                                PRO
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={handleGenerate}
                    className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-guardian-600 to-guardian-500 text-white hover:from-guardian-500 hover:to-guardian-400 shadow-lg shadow-guardian-600/25 transition-all flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Encrypt &amp; Generate Link
                  </button>
                </div>
              </motion.div>
            )}

            {/* Encrypting */}
            {step === 'encrypting' && (
              <motion.div
                key="encrypting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 rounded-2xl bg-guardian-500/20 flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
                  <Lock className="w-8 h-8 text-guardian-400 animate-pulse" />
                </div>
                <p className="text-lg font-semibold text-white mb-1">Encrypting in browser...</p>
                <p className="text-sm text-dark-300 mb-1">{fileName}</p>
                <p className="text-xs text-dark-400 mb-6 font-mono">AES-256-GCM • PBKDF2 key derivation</p>
                <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-guardian-500 to-vault-400 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-dark-400 mt-2 font-mono">{Math.min(Math.round(progress), 100)}%</p>
              </motion.div>
            )}

            {/* Step 4: Complete */}
            {step === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-full bg-vault-500/20 flex items-center justify-center mx-auto mb-6">
                  <Check className="w-8 h-8 text-vault-400" />
                </div>
                <p className="text-xl font-bold text-white mb-2">Your secure link is ready!</p>
                <p className="text-sm text-dark-300 mb-6">
                  Click <strong className="text-white">Open &amp; Decrypt</strong> to test the full flow, or copy the link.
                </p>

                {/* Generated link */}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-dark-800 border border-dark-500 mb-2">
                  <Link2 className="w-4 h-4 text-guardian-400 shrink-0" />
                  <span className="text-xs font-mono text-dark-200 truncate flex-1 text-left">
                    {generatedLink}
                  </span>
                </div>

                <div className="flex gap-2 mb-6">
                  <button
                    onClick={handleCopy}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      copied
                        ? 'bg-vault-500/20 text-vault-400 border border-vault-500/30'
                        : 'bg-guardian-500 text-white hover:bg-guardian-400'
                    }`}
                  >
                    {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Link</>}
                  </button>
                  <button
                    onClick={handleOpenLink}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-vault-600 text-white hover:bg-vault-500 flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-vault-600/20"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open &amp; Decrypt
                  </button>
                </div>

                {/* Details */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-dark-700/50 text-center">
                    <p className="text-xs text-dark-400">Expires</p>
                    <p className="text-sm font-semibold text-white">
                      {expiry === '1h' ? '1 Hour' : expiry === '24h' ? '24 Hours' : expiry === '7d' ? '7 Days' : '30 Days'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-dark-700/50 text-center">
                    <p className="text-xs text-dark-400">Downloads</p>
                    <p className="text-sm font-semibold text-white">
                      {downloadLimit === 'unlimited' ? 'Unlimited' : downloadLimit === '1' ? 'One-time' : downloadLimit}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-dark-700/50 text-center">
                    <p className="text-xs text-dark-400">Encryption</p>
                    <p className="text-sm font-semibold text-vault-400">AES-256</p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-dark-700/30 mb-6">
                  <FileIcon className="w-4 h-4 text-guardian-400" />
                  <span className="text-xs text-dark-200">{fileName}</span>
                  <span className="text-xs text-dark-400">•</span>
                  <span className="text-xs text-dark-400">{fileSize}</span>
                  <span className="text-xs text-dark-400">•</span>
                  <span className="text-xs text-vault-400 font-medium flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Encrypted
                  </span>
                </div>

                <button
                  onClick={reset}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium glass-light text-dark-200 hover:text-white transition-all hover:bg-white/[0.06]"
                >
                  Upload Another File
                </button>
              </motion.div>
            )}
              </>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
