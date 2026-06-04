import { Shield, Lock, ExternalLink, Mail } from 'lucide-react';

function scrollTo(hash: string) {
  const el = document.querySelector(hash);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

export default function Footer() {
  return (
    <footer className="relative border-t border-dark-600/50 py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="flex items-center gap-2.5 mb-4"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-guardian-500 to-guardian-700">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                Guardian<span className="text-guardian-400">Box</span>
              </span>
            </a>
            <p className="text-sm text-dark-300 leading-relaxed max-w-md">
              End-to-end encrypted file sharing built on zero-knowledge architecture.
              Your files are encrypted in-browser — even we can't see them.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <a href="#" className="text-dark-300 hover:text-white transition-colors">
                <ExternalLink className="w-5 h-5" />
              </a>
              <a href="#" className="text-dark-300 hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Features', href: '#features' },
                { label: 'Pricing', href: '#pricing' },
                { label: 'How It Works', href: '#how-it-works' },
                { label: 'Try Demo', href: '#demo' },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={(e) => { e.preventDefault(); scrollTo(link.href); }}
                    className="text-sm text-dark-300 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {['Privacy Policy', 'Terms of Service', 'Security Audit', 'GDPR', 'Contact'].map(
                (link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-dark-300 hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-dark-600/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-dark-400">
            © 2025 GuardianBox. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-xs text-dark-400">
            <Lock className="w-3 h-3 text-vault-500" />
            <span>Protected by AES-256-GCM • Zero-Knowledge Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
