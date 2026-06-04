// User store — tracks plan, usage, and quota enforcement

import type { Plan } from './planLimits';

const USERS_KEY = 'guardianbox_users';
const SESSION_KEY = 'guardianbox_session';
const USAGE_KEY = 'guardianbox_usage';

export interface UserData {
  name: string;
  email: string;
  plan: Plan;
}

interface StoredUser {
  name: string;
  email: string;
  password: string;
  plan: Plan;
}

interface UsageRecord {
  email: string;
  day: string;              // YYYY-MM-DD
  filesToday: number;       // count of uploads today
  bandwidthTodayMB: number; // MB uploaded today
  activeFiles: number;      // current active files (not expired)
}

function getUsers(): StoredUser[] {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
  catch { return []; }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function saveSession(user: UserData) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getSession(): UserData | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/** Find user by email */
export function findUser(email: string): StoredUser | null {
  const users = getUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

/** Create a new user (returns false if email taken) */
export function createUser(name: string, email: string, password: string): boolean {
  const users = getUsers();
  if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) return false;
  users.push({ name, email, password, plan: 'free' });
  saveUsers(users);
  return true;
}

/** Authenticate — returns user or null */
export function authenticate(email: string, password: string): StoredUser | null {
  const user = findUser(email);
  if (!user || user.password !== password) return null;
  return user;
}

/** Update user's plan */
export function upgradePlan(email: string, plan: Plan) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
  if (idx === -1) return;
  users[idx].plan = plan;
  saveUsers(users);
  // Update session if this is the current user
  const session = getSession();
  if (session && session.email.toLowerCase() === email.toLowerCase()) {
    saveSession({ ...session, plan });
  }
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getUsage(email: string): UsageRecord {
  try {
    const all = JSON.parse(localStorage.getItem(USAGE_KEY) || '{}') as Record<string, UsageRecord>;
    const key = email.toLowerCase();
    const rec = all[key];
    if (!rec || rec.day !== todayKey()) {
      // Reset daily counters
      const fresh: UsageRecord = {
        email: key,
        day: todayKey(),
        filesToday: 0,
        bandwidthTodayMB: 0,
        activeFiles: rec?.activeFiles ?? 0,
      };
      all[key] = fresh;
      localStorage.setItem(USAGE_KEY, JSON.stringify(all));
      return fresh;
    }
    return rec;
  } catch {
    return { email: email.toLowerCase(), day: todayKey(), filesToday: 0, bandwidthTodayMB: 0, activeFiles: 0 };
  }
}

function saveUsage(rec: UsageRecord) {
  try {
    const all = JSON.parse(localStorage.getItem(USAGE_KEY) || '{}') as Record<string, UsageRecord>;
    all[rec.email] = rec;
    localStorage.setItem(USAGE_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

export interface UsageSnapshot {
  filesToday: number;
  bandwidthTodayMB: number;
  activeFiles: number;
}

export function getUsageSnapshot(email: string): UsageSnapshot {
  const rec = getUsage(email);
  return {
    filesToday: rec.filesToday,
    bandwidthTodayMB: rec.bandwidthTodayMB,
    activeFiles: rec.activeFiles,
  };
}

export function recordUpload(email: string, sizeMB: number) {
  const rec = getUsage(email);
  rec.filesToday += 1;
  rec.bandwidthTodayMB += sizeMB;
  rec.activeFiles += 1;
  saveUsage(rec);
}

export function decrementActiveFiles(email: string) {
  const rec = getUsage(email);
  if (rec.activeFiles > 0) rec.activeFiles -= 1;
  saveUsage(rec);
}

/** Refresh activeFiles count by re-computing from IndexedDB — call after cleanup */
export function setActiveFilesCount(email: string, count: number) {
  const rec = getUsage(email);
  rec.activeFiles = count;
  saveUsage(rec);
}
