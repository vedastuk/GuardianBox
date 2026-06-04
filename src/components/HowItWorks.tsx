import { motion } from 'framer-motion';
import { Upload, KeyRound, Link2, Download, ArrowDown } from 'lucide-react';

const steps = [
  {
    num: '01',
    icon: Upload,
    title: 'Upload Your File',
    description:
      'Drag & drop or select your file. It stays on your device until encryption is complete.',
    detail: 'Supported: All file types up to 100MB (Free) or 5GB (Pro)',
    color: 'guardian',
  },
  {
    num: '02',
    icon: KeyRound,
    title: 'Set a Password',
    description:
      'Choose a strong password. It\'s used to derive an AES-256-GCM encryption key using PBKDF2 — entirely in your browser.',
    detail: 'The password never leaves your device',
    color: 'vault',
  },
  {
    num: '03',
    icon: Link2,
    title: 'Get a Secure Link',
    description:
      'Your encrypted file is uploaded and you receive a shareable link. The password is stored in the URL hash, invisible to the server.',
    detail: 'Set expiration: 1 hour, 24 hours, 7 days, or one-time download',
    color: 'sky',
  },
  {
    num: '04',
    icon: Download,
    title: 'Recipient Decrypts',
    description:
      'The recipient opens the link, the encrypted blob is downloaded, and their browser decrypts it locally using the password from the hash.',
    detail: 'Zero server-side knowledge of file contents',
    color: 'purple',
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  guardian: {
    bg: 'bg-guardian-500/15',
    text: 'text-guardian-400',
    border: 'border-guardian-500/30',
    glow: 'shadow-guardian-500/20',
  },
  vault: {
    bg: 'bg-vault-500/15',
    text: 'text-vault-400',
    border: 'border-vault-500/30',
    glow: 'shadow-vault-500/20',
  },
  sky: {
    bg: 'bg-sky-500/15',
    text: 'text-sky-400',
    border: 'border-sky-500/30',
    glow: 'shadow-sky-500/20',
  },
  purple: {
    bg: 'bg-purple-500/15',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    glow: 'shadow-purple-500/20',
  },
};

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-32 overflow-hidden">
      <div className="absolute right-0 top-1/3 w-[500px] h-[500px] rounded-full bg-vault-500/5 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-5xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold text-vault-400 bg-vault-500/10 border border-vault-500/20 mb-4">
            HOW IT WORKS
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-4">
            Four Steps to{' '}
            <span className="bg-gradient-to-r from-vault-400 to-guardian-400 bg-clip-text text-transparent">
              Total Privacy
            </span>
          </h2>
          <p className="mt-4 text-lg text-dark-200 max-w-2xl mx-auto">
            From upload to download, your files never exist in an unencrypted state on our servers.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-guardian-500/40 via-vault-500/40 to-purple-500/40 md:-translate-x-px" />

          {steps.map((step, index) => {
            const colors = colorMap[step.color];
            const isEven = index % 2 === 0;

            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative flex items-start gap-8 mb-16 last:mb-0 ${
                  isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                } flex-row`}
              >
                {/* Timeline dot */}
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 z-10">
                  <div className={`w-10 h-10 rounded-full ${colors.bg} ${colors.border} border flex items-center justify-center shadow-lg ${colors.glow}`}>
                    <step.icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                </div>

                {/* Spacer for mobile */}
                <div className="w-16 shrink-0 md:hidden" />

                {/* Content card */}
                <div className={`flex-1 md:w-[calc(50%-3rem)] ${isEven ? 'md:pr-16 md:text-right' : 'md:pl-16'}`}>
                  <div className="glass p-6 rounded-2xl hover:bg-white/[0.03] transition-all group">
                    <span className={`text-xs font-bold ${colors.text} font-mono`}>
                      STEP {step.num}
                    </span>
                    <h3 className="text-xl font-semibold text-white mt-2 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-sm text-dark-200 leading-relaxed">
                      {step.description}
                    </p>
                    <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${colors.bg} ${colors.border} border`}>
                      <span className={`text-xs font-medium ${colors.text}`}>
                        {step.detail}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Empty space for the other side on desktop */}
                <div className="hidden md:block flex-1 md:w-[calc(50%-3rem)]" />
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mt-16"
        >
          <div className="inline-flex items-center gap-2 glass px-6 py-3 rounded-full">
            <ArrowDown className="w-4 h-4 text-guardian-400 animate-bounce" />
            <span className="text-sm text-dark-200">
              Your file is encrypted end-to-end. <span className="text-guardian-400 font-semibold">We never see it.</span>
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
