import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Check,
  AlertCircle,
} from 'lucide-react';
import { createUser, authenticate, saveSession } from '../lib/userStore';
import type { Plan } from '../lib/planLimits';

export interface UserData {
  name: string;
  email: string;
  plan: Plan;
}

interface AuthPageProps {
  initialMode: 'signin' | 'signup';
  onSuccess: (user: UserData) => void;
  onBack: () => void;
}

function GoogleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function AppleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

import { getSession, clearSession } from '../lib/userStore';

export { getSession, clearSession };

export default function AuthPage({ initialMode, onSuccess, onBack }: AuthPageProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successUser, setSuccessUser] = useState<UserData | null>(null);

  // Sync mode when hash changes externally
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const clearError = () => setError('');

  const doSignUp = (userName: string, userEmail: string, userPassword: string) => {
    const ok = createUser(userName, userEmail, userPassword);
    if (!ok) {
      setError('An account with this email already exists. Try signing in instead.');
      return;
    }
    // Authenticate immediately to create session
    const found = authenticate(userEmail, userPassword);
    if (!found) return;
    const userData: UserData = { name: found.name, email: found.email, plan: found.plan };
    saveSession(userData);
    setSuccessUser(userData);
    setSuccess(true);
  };

  const doSignIn = (userEmail: string, userPassword: string) => {
    const found = authenticate(userEmail, userPassword);
    if (!found) {
      setError('Invalid email or password. Check your credentials or sign up for a new account.');
      return;
    }
    const userData: UserData = { name: found.name, email: found.email, plan: found.plan };
    saveSession(userData);
    setSuccessUser(userData);
    setSuccess(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (mode === 'signup') {
      if (!agreed) {
        setError('Please agree to the Terms of Service and Privacy Policy.');
        return;
      }
      doSignUp(name, email, password);
    } else {
      doSignIn(email, password);
    }
  };

  const handleSocialSignIn = (provider: string) => {
    clearError();
    const socialName = provider === 'google' ? 'Google User' : 'Apple User';
    const socialEmail = provider === 'google' ? 'user@gmail.com' : 'user@icloud.com';
    if (mode === 'signup') {
      doSignUp(socialName, socialEmail, 'social-auth-' + provider);
    } else {
      // For social sign-in, auto-create if not exists
      const ok = createUser(socialName, socialEmail, 'social-auth-' + provider);
      const found = authenticate(socialEmail, 'social-auth-' + provider);
      if (!found) return;
      void ok;
      const userData: UserData = { name: found.name, email: found.email, plan: found.plan };
      saveSession(userData);
      setSuccessUser(userData);
      setSuccess(true);
    }
  };

  const finishSuccess = () => {
    if (successUser) onSuccess(successUser);
  };

  // ─── Success Screen ───
  if (success && successUser) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-50" />
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-guardian-600/8 blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-vault-500/6 blur-[100px]" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-md text-center"
        >
          <div className="glass rounded-2xl p-10 border border-guardian-500/20">
            <div className="w-16 h-16 rounded-full bg-vault-500/20 flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-vault-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {mode === 'signup' ? 'Account Created!' : 'Welcome Back!'}
            </h2>
            <p className="text-sm text-dark-200 mb-1">
              {mode === 'signup'
                ? `Welcome, ${successUser.name}!`
                : `Signed in as ${successUser.name}`}
            </p>
            <p className="text-xs text-dark-400 mb-8">{successUser.email}</p>
            <button
              onClick={finishSuccess}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-guardian-600 to-guardian-500 text-white hover:from-guardian-500 hover:to-guardian-400 shadow-lg shadow-guardian-600/25 transition-all"
            >
              Continue to GuardianBox
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Auth Form ───
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-50" />
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-guardian-600/8 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full bg-vault-500/6 blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <button onClick={onBack} className="inline-flex items-center gap-2.5 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-guardian-500 to-guardian-700 shadow-lg shadow-guardian-500/25">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">
              Guardian<span className="text-guardian-400">Box</span>
            </span>
          </button>
          <p className="text-sm text-dark-300">
            {mode === 'signin' ? 'Sign in to your account' : 'Create your free account'}
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 border border-guardian-500/20">
          {/* Tabs */}
          <div className="flex rounded-xl bg-dark-800 p-1 mb-8">
            <button
              onClick={() => { setMode('signin'); clearError(); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'signin'
                  ? 'bg-guardian-600 text-white shadow-lg shadow-guardian-600/30'
                  : 'text-dark-300 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); clearError(); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'signup'
                  ? 'bg-guardian-600 text-white shadow-lg shadow-guardian-600/30'
                  : 'text-dark-300 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300 leading-relaxed">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Social Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleSocialSignIn('google')}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-gray-50 transition-colors text-sm font-semibold text-gray-700 shadow-sm"
            >
              <GoogleIcon className="w-5 h-5" />
              {mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
            </button>
            <button
              onClick={() => handleSocialSignIn('apple')}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-black hover:bg-gray-900 transition-colors text-sm font-semibold text-white border border-dark-500/30 shadow-sm"
            >
              <AppleIcon className="w-5 h-5" />
              {mode === 'signin' ? 'Sign in with Apple' : 'Sign up with Apple'}
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-dark-600" />
            <span className="text-xs text-dark-400 font-medium uppercase tracking-wide">or continue with email</span>
            <div className="flex-1 h-px bg-dark-600" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="flex items-center gap-2 text-xs font-medium text-dark-200 mb-1.5">
                    <User className="w-3.5 h-3.5 text-guardian-400" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); clearError(); }}
                    placeholder="John Doe"
                    required={mode === 'signup'}
                    className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-dark-500 text-white placeholder-dark-400 text-sm focus:outline-none focus:border-guardian-500 focus:ring-1 focus:ring-guardian-500/30 transition-all"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-dark-200 mb-1.5">
                <Mail className="w-3.5 h-3.5 text-guardian-400" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError(); }}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-dark-500 text-white placeholder-dark-400 text-sm focus:outline-none focus:border-guardian-500 focus:ring-1 focus:ring-guardian-500/30 transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-dark-200 mb-1.5">
                <Lock className="w-3.5 h-3.5 text-guardian-400" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError(); }}
                  placeholder={mode === 'signup' ? 'Min 8 characters' : 'Enter your password'}
                  required
                  minLength={mode === 'signup' ? 8 : undefined}
                  className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-dark-500 text-white placeholder-dark-400 text-sm focus:outline-none focus:border-guardian-500 focus:ring-1 focus:ring-guardian-500/30 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => setError('Password reset is not available in this demo.')}
                  className="text-xs text-guardian-400 hover:text-guardian-300 mt-2 transition-colors"
                >
                  Forgot password?
                </button>
              )}
            </div>

            {mode === 'signup' && (
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="relative mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => { setAgreed(e.target.checked); clearError(); }}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      agreed
                        ? 'bg-guardian-500 border-guardian-500'
                        : 'bg-dark-800 border-dark-500'
                    }`}
                  >
                    {agreed && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
                <span className="text-xs text-dark-300 leading-relaxed">
                  I agree to the{' '}
                  <span className="text-guardian-400 hover:text-guardian-300 cursor-pointer">Terms of Service</span>
                  {' '}and{' '}
                  <span className="text-guardian-400 hover:text-guardian-300 cursor-pointer">Privacy Policy</span>
                </span>
              </label>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-guardian-600 to-guardian-500 text-white hover:from-guardian-500 hover:to-guardian-400 shadow-lg shadow-guardian-600/25 transition-all mt-2"
            >
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Toggle text */}
          <p className="text-center text-xs text-dark-400 mt-6">
            {mode === 'signin' ? (
              <>
                {"Don't have an account? "}
                <button onClick={() => { setMode('signup'); clearError(); }} className="text-guardian-400 font-semibold hover:text-guardian-300 transition-colors">
                  Sign up free
                </button>
              </>
            ) : (
              <>
                {'Already have an account? '}
                <button onClick={() => { setMode('signin'); clearError(); }} className="text-guardian-400 font-semibold hover:text-guardian-300 transition-colors">
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <div className="flex items-center gap-1.5 text-dark-400">
            <Lock className="w-3 h-3 text-vault-500" />
            <span className="text-xs">AES-256-GCM</span>
          </div>
          <div className="w-px h-3 bg-dark-600" />
          <div className="flex items-center gap-1.5 text-dark-400">
            <Shield className="w-3 h-3 text-guardian-400" />
            <span className="text-xs">Zero Knowledge</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
