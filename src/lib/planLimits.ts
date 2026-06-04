// Plan limits configuration

export type Plan = 'free' | 'pro' | 'payperfile';

export interface PlanLimits {
  name: string;
  maxFileSizeMB: number;           // MB
  maxExpiry: string;               // '1h' | '24h' | '7d' | '30d'
  allowedExpiries: string[];       // list of allowed values
  allowedDownloadLimits: string[]; // list of allowed values
  maxActiveFiles: number;          // null = unlimited
  dailyUploadCap: number;          // files per day, null = unlimited
  dailyBandwidthMB: number;        // MB per day, null = unlimited
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    name: 'Free',
    maxFileSizeMB: 100,
    maxExpiry: '24h',
    allowedExpiries: ['1h', '24h', '7d'],
    allowedDownloadLimits: ['1', '5'],
    maxActiveFiles: 3,
    dailyUploadCap: 5,
    dailyBandwidthMB: 200,
  },
  pro: {
    name: 'Pro',
    maxFileSizeMB: 5 * 1024,
    maxExpiry: '30d',
    allowedExpiries: ['1h', '24h', '7d', '30d'],
    allowedDownloadLimits: ['1', '5', 'unlimited'],
    maxActiveFiles: Infinity,
    dailyUploadCap: Infinity,
    dailyBandwidthMB: Infinity,
  },
  payperfile: {
    name: 'Pay Per File',
    maxFileSizeMB: 5 * 1024,
    maxExpiry: '30d',
    allowedExpiries: ['1h', '24h', '7d', '30d'],
    allowedDownloadLimits: ['1', '5', 'unlimited'],
    maxActiveFiles: 1,
    dailyUploadCap: 10,
    dailyBandwidthMB: 10 * 1024,
  },
};

export const ALL_EXPIRIES = [
  { value: '1h', label: '1 Hour', pro: false },
  { value: '24h', label: '24 Hours', pro: false },
  { value: '7d', label: '7 Days', pro: false },
  { value: '30d', label: '30 Days', pro: true },
];

export function isExpired(createdAt: number, expiry: string): boolean {
  const expiryMs: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };
  const ttl = expiryMs[expiry] ?? expiryMs['24h'];
  return Date.now() - createdAt > ttl;
}

export function formatMB(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB`;
  return `${mb} MB`;
}
