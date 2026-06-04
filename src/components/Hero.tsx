import { motion } from 'framer-motion';
import { Shield, Lock, Upload, ArrowRight } from 'lucide-react';
import { getSession } from '../lib/userStore';

function scrollTo(hash: string) {
  const el = document.querySelector(hash);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function handleUploadClick() {
  const session = getSession();
  if (session) {
    scrollTo('#demo');
  } else {
    window.location.hash = 'signup';
  }
}

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-pattern" />
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-guardian-600/10 blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-vault-500/8 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-guardian-400/40"
          style={{
            top: `${20 + Math.random() * 60}%`,
            left: `${10 + Math.random() * 80}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 3,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        />
      ))}

      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-light mb-8"
            >
              <div className="w-2 h-2 rounded-full bg-vault-400 animate-pulse" />
              <span className="text-xs font-medium text-vault-400">End-to-End Encrypted</span>
              <span className="text-xs text-dark-200">•</span>
              <span className="text-xs text-dark-200">Zero-Knowledge Architecture</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight"
            >
              <span className="text-white">Share Files.</span>
              <br />
              <span className="bg-gradient-to-r from-guardian-400 via-guardian-300 to-vault-400 bg-clip-text text-transparent animate-gradient">
                Not Secrets.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-6 text-lg md:text-xl text-dark-200 leading-relaxed max-w-xl"
            >
              GuardianBox encrypts your files in the browser before they ever leave your device. 
              Even we can't see what you share. Your files. Your password. Your control.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row gap-4"
            >
              <button
                onClick={handleUploadClick}
                className="group flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-guardian-600 to-guardian-500 rounded-xl hover:from-guardian-500 hover:to-guardian-400 transition-all shadow-xl shadow-guardian-600/25 hover:shadow-guardian-500/40 hover:-translate-y-0.5"
              >
                <Upload className="w-5 h-5" />
                Upload &amp; Encrypt
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => scrollTo('#how-it-works')}
                className="flex items-center justify-center gap-2 px-8 py-4 text-base font-medium text-dark-100 glass-light rounded-xl hover:text-white hover:bg-white/10 transition-all"
              >
                See How It Works
              </button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="mt-12 flex items-center gap-6 text-dark-300"
            >
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-vault-500" />
                <span className="text-xs font-medium">AES-256-GCM</span>
              </div>
              <div className="w-px h-4 bg-dark-500" />
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-guardian-400" />
                <span className="text-xs font-medium">Zero Knowledge</span>
              </div>
              <div className="w-px h-4 bg-dark-500" />
              <span className="text-xs font-medium">Web Crypto API</span>
            </motion.div>
          </div>

          {/* Right - Animated Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:block relative"
          >
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              {/* Orbiting ring */}
              <div className="absolute inset-8 rounded-full border border-dark-500/40 animate-[spin_30s_linear_infinite]">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-guardian-500 shadow-lg shadow-guardian-500/50" />
              </div>
              <div className="absolute inset-16 rounded-full border border-dark-500/30 animate-[spin_20s_linear_infinite_reverse]">
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-vault-500 shadow-lg shadow-vault-500/50" />
              </div>
              <div className="absolute inset-24 rounded-full border border-dark-500/20 animate-[spin_15s_linear_infinite]">
                <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 rounded-full bg-guardian-300 shadow-lg shadow-guardian-300/50" />
              </div>

              {/* Center shield */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="absolute -inset-4 rounded-2xl bg-gradient-to-br from-guardian-500/20 to-vault-500/20 blur-xl animate-pulse-glow" />
                  <div className="relative glass p-8 rounded-2xl">
                    <Shield className="w-20 h-20 text-guardian-400" strokeWidth={1.5} />
                  </div>
                </div>
              </div>

              {/* Floating cards */}
              <motion.div
                className="absolute top-8 right-4 glass p-3 rounded-xl"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-vault-500/20 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-vault-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Encrypted</p>
                    <p className="text-[10px] text-dark-300">AES-256-GCM</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute bottom-12 left-0 glass p-3 rounded-xl"
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-guardian-500/20 flex items-center justify-center">
                    <Upload className="w-4 h-4 text-guardian-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">contract.pdf</p>
                    <p className="text-[10px] text-dark-300">2.4 MB • Secure</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute top-1/3 -left-2 glass px-3 py-2 rounded-lg"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              >
                <p className="text-[10px] font-mono text-guardian-300">Password: ••••••••</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark-900 to-transparent" />
    </section>
  );
}
