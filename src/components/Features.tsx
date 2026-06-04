import { motion } from 'framer-motion';
import {
  ShieldCheck,
  KeyRound,
  Timer,
  Upload,
  Layers,
  Eye,
} from 'lucide-react';

const features = [
  {
    icon: ShieldCheck,
    title: 'In-Browser Encryption',
    description:
      'Files are encrypted using the Web Crypto API (AES-256-GCM) before any data leaves your browser. The server only ever sees encrypted blobs.',
    color: 'guardian',
    gradient: 'from-guardian-500/20 to-guardian-700/20',
    iconColor: 'text-guardian-400',
    borderColor: 'border-guardian-500/20',
  },
  {
    icon: KeyRound,
    title: 'Password-Protected Links',
    description:
      'Set a password for decryption that is embedded in the URL hash fragment — it is never transmitted to the server. Only the recipient can unlock.',
    color: 'vault',
    gradient: 'from-vault-500/20 to-vault-600/20',
    iconColor: 'text-vault-400',
    borderColor: 'border-vault-500/20',
  },
  {
    icon: Timer,
    title: 'Disposable Links',
    description:
      'Set expiration times (24 hours, 7 days) or download limits (one-time download). Files are permanently deleted once conditions are met.',
    color: 'amber',
    gradient: 'from-amber-500/20 to-orange-600/20',
    iconColor: 'text-amber-400',
    borderColor: 'border-amber-500/20',
  },
  {
    icon: Upload,
    title: 'Simple Drag & Drop',
    description:
      'A clean, intuitive interface — just drag your file, set a password, and get a secure link. No complicated setup required.',
    color: 'guardian',
    gradient: 'from-sky-500/20 to-blue-600/20',
    iconColor: 'text-sky-400',
    borderColor: 'border-sky-500/20',
  },
  {
    icon: Layers,
    title: 'Flexible File Limits',
    description:
      'Free users can upload up to 100MB with 24-hour storage. Pro users unlock 5GB uploads with extended durations and a link dashboard.',
    color: 'purple',
    gradient: 'from-purple-500/20 to-indigo-600/20',
    iconColor: 'text-purple-400',
    borderColor: 'border-purple-500/20',
  },
  {
    icon: Eye,
    title: 'Zero-Knowledge Architecture',
    description:
      'Platform administrators have zero access to file contents. We store encrypted data blobs — nothing more. Your privacy is non-negotiable.',
    color: 'rose',
    gradient: 'from-rose-500/20 to-pink-600/20',
    iconColor: 'text-rose-400',
    borderColor: 'border-rose-500/20',
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

export default function Features() {
  return (
    <section id="features" className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-guardian-600/5 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold text-guardian-400 bg-guardian-500/10 border border-guardian-500/20 mb-4">
            KEY FEATURES
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-4">
            Security Without{' '}
            <span className="bg-gradient-to-r from-guardian-400 to-vault-400 bg-clip-text text-transparent">
              Compromise
            </span>
          </h2>
          <p className="mt-4 text-lg text-dark-200 max-w-2xl mx-auto">
            Every feature is designed with a single principle: your data should be
            accessible only to you and your chosen recipients.
          </p>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              className={`group relative p-8 rounded-2xl glass hover:bg-white/[0.04] transition-all duration-500 border ${feature.borderColor} hover:border-opacity-50 hover:-translate-y-1`}
            >
              {/* Gradient bg on hover */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6`}>
                  <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                </div>

                <h3 className="text-lg font-semibold text-white mb-3">
                  {feature.title}
                </h3>

                <p className="text-sm text-dark-200 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
