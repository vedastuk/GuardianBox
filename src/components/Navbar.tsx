import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Menu, X, LogOut, User, ChevronDown, Crown } from 'lucide-react';
import type { UserData } from './AuthPage';
import { PLAN_LIMITS } from '../lib/planLimits';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Try Demo', href: '#demo' },
];

function scrollTo(hash: string) {
  const el = document.querySelector(hash);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

interface NavbarProps {
  user: UserData | null;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '';

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'glass shadow-lg shadow-black/20' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="flex items-center gap-2.5 group"
        >
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-guardian-500 to-guardian-700 shadow-lg shadow-guardian-500/25 group-hover:shadow-guardian-500/40 transition-shadow">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Guardian<span className="text-guardian-400">Box</span>
          </span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => { e.preventDefault(); scrollTo(link.href); }}
              className="text-sm font-medium text-dark-100 hover:text-white transition-colors relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-guardian-400 group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </nav>

        {/* Desktop CTA / User menu */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl glass-light hover:bg-white/[0.08] transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-guardian-500 to-guardian-700 flex items-center justify-center text-xs font-bold text-white">
                  {initials}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-sm font-medium text-white leading-tight">{user.name}</p>
                  <p className="text-[10px] text-dark-300 leading-tight">{user.email}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-dark-300 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 glass rounded-xl border border-dark-500/50 shadow-xl shadow-black/30 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-dark-600/50">
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <p className="text-xs text-dark-300 mt-0.5">{user.email}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Crown className={`w-3 h-3 ${user.plan === 'free' ? 'text-dark-400' : 'text-amber-400'}`} />
                        <span className={`text-[10px] font-semibold uppercase tracking-wide ${user.plan === 'free' ? 'text-dark-400' : 'text-amber-400'}`}>
                          {PLAN_LIMITS[user.plan].name}
                        </span>
                        {user.plan === 'free' && (
                          <button
                            onClick={() => { setDropdownOpen(false); window.location.hash = 'pay/pro'; }}
                            className="ml-auto text-[10px] font-semibold text-guardian-400 hover:text-guardian-300 transition-colors"
                          >
                            Upgrade →
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="p-1.5">
                      <button
                        onClick={() => { setDropdownOpen(false); scrollTo('#demo'); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-dark-200 hover:text-white hover:bg-white/[0.06] transition-all text-left"
                      >
                        <User className="w-4 h-4" />
                        Dashboard
                      </button>
                      {user.plan === 'free' && (
                        <button
                          onClick={() => { setDropdownOpen(false); window.location.hash = 'pay/pro'; }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-all text-left"
                        >
                          <Crown className="w-4 h-4" />
                          Upgrade to Pro
                        </button>
                      )}
                      <button
                        onClick={() => { setDropdownOpen(false); onLogout(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <button
                onClick={() => { window.location.hash = 'signin'; }}
                className="px-4 py-2 text-sm font-medium text-dark-100 hover:text-white transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => { window.location.hash = 'signup'; }}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-guardian-600 to-guardian-500 rounded-lg hover:from-guardian-500 hover:to-guardian-400 transition-all shadow-lg shadow-guardian-600/25 hover:shadow-guardian-500/40"
              >
                Get Started Free
              </button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-dark-100 hover:text-white"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-dark-500/30"
          >
            <nav className="flex flex-col px-6 py-4 gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => { e.preventDefault(); setMobileOpen(false); scrollTo(link.href); }}
                  className="text-sm font-medium text-dark-100 hover:text-white py-2.5"
                >
                  {link.label}
                </a>
              ))}

              <div className="border-t border-dark-600/50 mt-2 pt-3">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-1 py-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-guardian-500 to-guardian-700 flex items-center justify-center text-xs font-bold text-white">
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        <p className="text-xs text-dark-300">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setMobileOpen(false); onLogout(); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { setMobileOpen(false); window.location.hash = 'signin'; }}
                      className="w-full text-left text-sm font-medium text-dark-100 hover:text-white py-2.5"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => { setMobileOpen(false); window.location.hash = 'signup'; }}
                      className="mt-1 w-full px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-guardian-600 to-guardian-500 rounded-lg"
                    >
                      Get Started Free
                    </button>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
