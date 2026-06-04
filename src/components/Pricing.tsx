import { motion } from 'framer-motion';
import { Check, Sparkles, Zap } from 'lucide-react';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    period: 'forever',
    description: 'Perfect for quick, one-time file shares.',
    features: [
      'Up to 100MB per file',
      '24-hour maximum storage',
      'Password-protected links',
      'One-time download option',
      'AES-256-GCM encryption',
      'Drag & drop upload',
    ],
    cta: 'Get Started Free',
    popular: false,
    gradient: 'from-dark-600 to-dark-700',
    border: 'border-dark-500/50',
    ctaStyle: 'bg-dark-500 hover:bg-dark-400 text-white',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₹499',
    period: '/month',
    description: 'For professionals who regularly share sensitive documents.',
    features: [
      'Up to 5GB per file',
      'Up to 30-day storage',
      'Custom expiration dates',
      'Download limit controls',
      'Active links dashboard',
      'Priority support',
      'Custom branding on links',
      'Team sharing (coming soon)',
    ],
    cta: 'Upgrade to Pro',
    popular: true,
    gradient: 'from-guardian-600 to-guardian-700',
    border: 'border-guardian-500/40',
    ctaStyle:
      'bg-gradient-to-r from-guardian-500 to-guardian-400 hover:from-guardian-400 hover:to-guardian-300 text-white shadow-lg shadow-guardian-500/25',
  },
  {
    id: 'payperfile',
    name: 'Pay Per File',
    price: '₹49',
    period: '/file',
    description: 'One-time payment per large file. No subscription needed.',
    features: [
      'Up to 5GB per file',
      'Choose storage duration',
      'All Pro features per file',
      'No recurring charges',
      'Pay only when you need it',
      'Instant activation',
    ],
    cta: 'Upload & Pay',
    popular: false,
    gradient: 'from-dark-600 to-dark-700',
    border: 'border-vault-500/30',
    ctaStyle: 'bg-vault-600 hover:bg-vault-500 text-white',
  },
];

export default function Pricing() {
  const handleCta = (planId: string) => {
    if (planId === 'free') {
      window.location.hash = 'signup';
    } else {
      window.location.hash = `pay/${planId}`;
    }
  };

  return (
    <section id="pricing" className="relative py-32 overflow-hidden">
      <div className="absolute left-1/3 top-1/4 w-[600px] h-[400px] rounded-full bg-guardian-600/5 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold text-guardian-400 bg-guardian-500/10 border border-guardian-500/20 mb-4">
            PRICING
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-4">
            Simple,{' '}
            <span className="bg-gradient-to-r from-guardian-400 to-vault-400 bg-clip-text text-transparent">
              Transparent
            </span>{' '}
            Pricing
          </h2>
          <p className="mt-4 text-lg text-dark-200 max-w-2xl mx-auto">
            Start free. Upgrade only when you need more. Every tier includes full end-to-end encryption.
          </p>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className={`relative rounded-2xl ${plan.border} border ${
                plan.popular ? 'scale-[1.02] md:scale-105' : ''
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-guardian-500 to-guardian-400 text-white text-xs font-semibold shadow-lg shadow-guardian-500/30">
                    <Sparkles className="w-3 h-3" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className={`h-full rounded-2xl bg-gradient-to-b ${plan.gradient} p-8 ${plan.popular ? 'ring-1 ring-guardian-500/40' : ''}`}>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    {plan.name}
                    {plan.name === 'Pay Per File' && <Zap className="w-4 h-4 text-vault-400" />}
                  </h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-sm text-dark-300">{plan.period}</span>
                  </div>
                  <p className="mt-2 text-sm text-dark-200">{plan.description}</p>
                </div>

                <div className="border-t border-dark-500/30 pt-6 mb-8">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.popular ? 'text-guardian-400' : 'text-vault-400'}`} />
                        <span className="text-sm text-dark-100">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleCta(plan.id)}
                  className={`w-full py-3 px-6 rounded-xl text-sm font-semibold transition-all ${plan.ctaStyle}`}
                >
                  {plan.cta}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-xs text-dark-300 mt-8"
        >
          All plans include AES-256-GCM encryption, zero-knowledge architecture, and disposable links. Prices in INR (₹), inclusive of GST.
        </motion.p>
      </div>
    </section>
  );
}
