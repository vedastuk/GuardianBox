// User store — Firebase Auth for authentication, Firestore for user data & usage tracking

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import type { Plan } from './planLimits';

// ─── Types ───

export interface UserData {
  name: string;
  email: string;
  plan: Plan;
}

interface FirestoreUser {
  name: string;
  email: string;
  plan: Plan;
  createdAt: number;
}

interface UsageRecord {
  day: string;
  filesToday: number;
  bandwidthTodayMB: number;
  activeFiles: number;
}

// ─── Local session cache (for synchronous reads in UI) ───

const SESSION_KEY = 'guardianbox_session';
const USAGE_KEY = 'guardianbox_usage';

export function saveSession(user: UserData) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getSession(): UserData | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// ─── Firebase Auth ───

/** Sign up with email + password, create Firestore profile */
export async function createUser(name: string, email: string, password: string): Promise<UserData> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });

  const userData: UserData = { name, email, plan: 'free' };

  // Create Firestore document
  const fsUser: FirestoreUser = { name, email, plan: 'free', createdAt: Date.now() };
  await setDoc(doc(db, 'users', cred.user.uid), fsUser);

  saveSession(userData);
  return userData;
}

/** Sign in with email + password */
export async function authenticate(email: string, password: string): Promise<UserData> {
  const cred = await signInWithEmailAndPassword(auth, email, password);

  // Read profile from Firestore
  const snap = await getDoc(doc(db, 'users', cred.user.uid));
  let userData: UserData;
  if (snap.exists()) {
    const d = snap.data() as FirestoreUser;
    userData = { name: d.name, email: d.email, plan: d.plan };
  } else {
    // Firestore doc missing — create it
    userData = { name: cred.user.displayName || email, email, plan: 'free' };
    await setDoc(doc(db, 'users', cred.user.uid), { ...userData, createdAt: Date.now() });
  }

  saveSession(userData);
  return userData;
}

/** Sign in with Google popup */
export async function signInWithGoogle(): Promise<UserData> {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  return await syncFirestoreProfile(cred.user);
}

/** Sign in with Apple popup */
export async function signInWithApple(): Promise<UserData> {
  const provider = new OAuthProvider('apple.com');
  const cred = await signInWithPopup(auth, provider);
  return await syncFirestoreProfile(cred.user);
}

/** After social sign-in: sync Firestore profile (create if needed) */
async function syncFirestoreProfile(fbUser: FirebaseUser): Promise<UserData> {
  const snap = await getDoc(doc(db, 'users', fbUser.uid));
  let userData: UserData;

  if (snap.exists()) {
    const d = snap.data() as FirestoreUser;
    userData = { name: d.name, email: d.email, plan: d.plan };
  } else {
    const name = fbUser.displayName || fbUser.email || 'User';
    const email = fbUser.email || '';
    userData = { name, email, plan: 'free' };
    await setDoc(doc(db, 'users', fbUser.uid), { name, email, plan: 'free', createdAt: Date.now() });
  }

  saveSession(userData);
  return userData;
}

/** Sign out */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
  clearSession();
}

/** Upgrade user plan in Firestore */
export async function upgradePlan(email: string, plan: Plan): Promise<void> {
  const fbUser = auth.currentUser;
  if (fbUser) {
    await updateDoc(doc(db, 'users', fbUser.uid), { plan });
  }

  // Update local session
  const session = getSession();
  if (session && session.email.toLowerCase() === email.toLowerCase()) {
    saveSession({ ...session, plan });
  }
}

/** Listen for Firebase auth state changes */
export function onAuthChange(callback: (user: UserData | null) => void): () => void {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) {
      clearSession();
      callback(null);
      return;
    }
    try {
      const snap = await getDoc(doc(db, 'users', fbUser.uid));
      if (snap.exists()) {
        const d = snap.data() as FirestoreUser;
        const userData: UserData = { name: d.name, email: d.email, plan: d.plan };
        saveSession(userData);
        callback(userData);
      } else {
        const userData: UserData = {
          name: fbUser.displayName || fbUser.email || 'User',
          email: fbUser.email || '',
          plan: 'free',
        };
        saveSession(userData);
        callback(userData);
      }
    } catch {
      const session = getSession();
      callback(session);
    }
  });
}

// ─── Usage tracking (stays in localStorage for speed) ───

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
      const fresh: UsageRecord = {
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
    return { day: todayKey(), filesToday: 0, bandwidthTodayMB: 0, activeFiles: 0 };
  }
}

function saveUsage(email: string, rec: UsageRecord) {
  try {
    const all = JSON.parse(localStorage.getItem(USAGE_KEY) || '{}') as Record<string, UsageRecord>;
    all[email.toLowerCase()] = rec;
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
  saveUsage(email, rec);
}

export function decrementActiveFiles(email: string) {
  const rec = getUsage(email);
  if (rec.activeFiles > 0) rec.activeFiles -= 1;
  saveUsage(email, rec);
}

export function setActiveFilesCount(email: string, count: number) {
  const rec = getUsage(email);
  rec.activeFiles = count;
  saveUsage(email, rec);
}
