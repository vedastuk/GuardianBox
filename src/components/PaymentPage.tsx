import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Lock,
  CreditCard,
  Check,
  ArrowLeft,
  Smartphone,
  Building2,
  AlertCircle,
  Zap,
  Sparkles,
  IndianRupee,
} from 'lucide-react';
import { getSession, upgradePlan } from '../lib/userStore';
import type { Plan } from '../lib/planLimits';

interface PaymentPageProps {
  planId: string;
  onBack: () => void;
  onSuccess: () => void;
}

const planDetails: Record<string, { name: string; price: string; priceNum: number; period: string; badge?: string }> = {
  pro: { name: 'Pro Plan', price: '₹499', priceNum: 499, period: '/month', badge: 'Most Popular' },
  payperfile: { name: 'Pay Per File', price: '₹49', priceNum: 49, period: '/file' },
};

type PayMethod = 'card' | 'upi' | 'netbanking';

export default function PaymentPage({ planId, onBack, onSuccess }: PaymentPageProps) {
  const plan = planDetails[planId];
  const [method, setMethod] = useState<PayMethod>('card');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  // UPI
  const [upiId, setUpiId] = useState('');

  // Netbanking
  const [selectedBank, setSelectedBank] = useState('');

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const validate = (): boolean => {
    if (method === 'card') {
      const digits = cardNumber.replace(/\s/g, '');
      if (digits.length < 13) { setError('Please enter a valid card number.'); return false; }
      if (cardExpiry.length < 5) { setError('Please enter a valid expiry date (MM/YY).'); return false; }
      if (cardCvv.length < 3) { setError('Please enter a valid CVV.'); return false; }
      if (!cardName.trim()) { setError('Please enter the cardholder name.'); return false; }
    } else if (method === 'upi') {
      if (!upiId.includes('@')) { setError('Please enter a valid UPI ID (e.g. name@upi).'); return false; }
    } else if (method === 'netbanking') {
      if (!selectedBank) { setError('Please select a bank.'); return false; }
    }
    return true;
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      // Upgrade user plan on successful payment
      const session = getSession();
      if (session && (planId === 'pro' || planId === 'payperfile')) {
        upgradePlan(session.email, planId as Plan);
      }
      setDone(true);
    }, 2500);
  };

  if (!plan) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-50" />
        <div className="relative z-10 text-center">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Plan Not Found</h2>
          <button onClick={onBack} className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold bg-guardian-600 text-white">
            <ArrowLeft className="w-4 h-4 inline mr-2" />Go Back
          </button>
        </div>
      </div>
    );
  }

  // ─── Success ───
  if (done) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-50" />
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-vault-500/6 blur-[120px]" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-md text-center"
        >
          <div className="glass rounded-2xl p-10 border border-vault-500/20">
            <div className="w-16 h-16 rounded-full bg-vault-500/20 flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-vault-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
            <p className="text-sm text-dark-300 mb-1">{plan.name} activated</p>
            <div className="flex items-center justify-center gap-1 text-dark-400 text-xs mb-6">
              <IndianRupee className="w-3 h-3" />
              <span>{plan.priceNum} paid via {method === 'card' ? 'Card' : method === 'upi' ? 'UPI' : 'Net Banking'}</span>
            </div>

            <div className="p-4 rounded-xl bg-dark-700/50 mb-6 text-left">
              <p className="text-xs text-dark-400 mb-2">Transaction Details</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-dark-300">Order ID</span>
                  <span className="text-white font-mono">GB-{Date.now().toString(36).toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-dark-300">Plan</span>
                  <span className="text-white">{plan.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-dark-300">Amount</span>
                  <span className="text-vault-400 font-semibold">{plan.price}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-dark-300">Status</span>
                  <span className="text-vault-400 font-semibold flex items-center gap-1"><Check className="w-3 h-3" />Success</span>
                </div>
              </div>
            </div>

            <button
              onClick={onSuccess}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-guardian-600 to-guardian-500 text-white hover:from-guardian-500 hover:to-guardian-400 shadow-lg shadow-guardian-600/25 transition-all"
            >
              Continue to GuardianBox
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Processing ───
  if (processing) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-50" />
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-guardian-600/8 blur-[120px]" />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10 w-full max-w-md text-center"
        >
          <div className="glass rounded-2xl p-10 border border-guardian-500/20">
            <div className="w-16 h-16 rounded-2xl bg-guardian-500/20 flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
              <Lock className="w-8 h-8 text-guardian-400 animate-pulse" />
            </div>
            <p className="text-lg font-semibold text-white mb-1">Processing Payment...</p>
            <p className="text-sm text-dark-300 mb-1">{plan.price} for {plan.name}</p>
            <p className="text-xs text-dark-400 font-mono">Secure payment via 256-bit SSL</p>

            <div className="mt-8 w-full h-1.5 bg-dark-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-guardian-500 to-vault-400 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.2, ease: 'easeInOut' }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Payment Form ───
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-50" />
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-guardian-600/8 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full bg-vault-500/6 blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <button onClick={onBack} className="inline-flex items-center gap-2.5 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-guardian-500 to-guardian-700 shadow-lg shadow-guardian-500/25">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">
              Guardian<span className="text-guardian-400">Box</span>
            </span>
          </button>
        </div>

        <div className="glass rounded-2xl border border-guardian-500/20 overflow-hidden">
          {/* Order summary */}
          <div className="px-8 pt-8 pb-6 border-b border-dark-600/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-white">{plan.name}</h2>
                  {plan.badge && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-guardian-500/20 text-[10px] font-semibold text-guardian-400">
                      {planId === 'pro' ? <Sparkles className="w-2.5 h-2.5" /> : <Zap className="w-2.5 h-2.5" />}
                      {plan.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-dark-300">Secure checkout</p>
              </div>
              <div className="text-right">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-3xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-sm text-dark-300">{plan.period}</span>
                </div>
                <p className="text-[10px] text-dark-400 mt-0.5">Inclusive of GST</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Payment method tabs */}
            <div className="flex gap-2 mb-6">
              {([
                { id: 'card' as PayMethod, label: 'Card', icon: CreditCard },
                { id: 'upi' as PayMethod, label: 'UPI', icon: Smartphone },
                { id: 'netbanking' as PayMethod, label: 'Net Banking', icon: Building2 },
              ]).map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setMethod(m.id); setError(''); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    method === m.id
                      ? 'bg-guardian-500/20 text-guardian-400 border border-guardian-500/40'
                      : 'bg-dark-700/50 text-dark-300 border border-dark-600 hover:border-dark-400'
                  }`}
                >
                  <m.icon className="w-3.5 h-3.5" />
                  {m.label}
                </button>
              ))}
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
                    <p className="text-xs text-red-300">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handlePay} className="space-y-4">
              {/* ── Card ── */}
              {method === 'card' && (
                <motion.div
                  key="card-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs font-medium text-dark-200 mb-1.5 block">Card Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-dark-500 text-white placeholder-dark-400 text-sm focus:outline-none focus:border-guardian-500 focus:ring-1 focus:ring-guardian-500/30 transition-all pr-12 font-mono tracking-wider"
                      />
                      <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-dark-200 mb-1.5 block">Cardholder Name</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Name on card"
                      className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-dark-500 text-white placeholder-dark-400 text-sm focus:outline-none focus:border-guardian-500 focus:ring-1 focus:ring-guardian-500/30 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-dark-200 mb-1.5 block">Expiry</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-dark-500 text-white placeholder-dark-400 text-sm focus:outline-none focus:border-guardian-500 focus:ring-1 focus:ring-guardian-500/30 transition-all font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-dark-200 mb-1.5 block">CVV</label>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="•••"
                        maxLength={4}
                        className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-dark-500 text-white placeholder-dark-400 text-sm focus:outline-none focus:border-guardian-500 focus:ring-1 focus:ring-guardian-500/30 transition-all font-mono"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── UPI ── */}
              {method === 'upi' && (
                <motion.div
                  key="upi-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs font-medium text-dark-200 mb-1.5 block">UPI ID</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@paytm"
                        className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-dark-500 text-white placeholder-dark-400 text-sm focus:outline-none focus:border-guardian-500 focus:ring-1 focus:ring-guardian-500/30 transition-all pr-12"
                      />
                      <Smartphone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['@paytm', '@okaxis', '@ybl', '@ibl', '@apl'].map((suffix) => (
                      <button
                        key={suffix}
                        type="button"
                        onClick={() => {
                          const base = upiId.split('@')[0] || 'user';
                          setUpiId(base + suffix);
                        }}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-dark-700/50 text-dark-300 border border-dark-600 hover:border-dark-400 hover:text-white transition-all"
                      >
                        {suffix}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── Net Banking ── */}
              {method === 'netbanking' && (
                <motion.div
                  key="nb-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  <label className="text-xs font-medium text-dark-200 mb-1 block">Select Bank</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'sbi', name: 'State Bank of India' },
                      { id: 'hdfc', name: 'HDFC Bank' },
                      { id: 'icici', name: 'ICICI Bank' },
                      { id: 'axis', name: 'Axis Bank' },
                      { id: 'kotak', name: 'Kotak Mahindra' },
                      { id: 'bob', name: 'Bank of Baroda' },
                    ].map((bank) => (
                      <button
                        key={bank.id}
                        type="button"
                        onClick={() => { setSelectedBank(bank.id); setError(''); }}
                        className={`p-3 rounded-xl text-xs font-medium text-left transition-all ${
                          selectedBank === bank.id
                            ? 'bg-guardian-500/20 text-guardian-400 border border-guardian-500/40'
                            : 'bg-dark-700/50 text-dark-300 border border-dark-600 hover:border-dark-400'
                        }`}
                      >
                        <Building2 className="w-4 h-4 mb-1.5 opacity-60" />
                        {bank.name}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Pay button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-vault-600 to-vault-500 text-white hover:from-vault-500 hover:to-vault-400 shadow-lg shadow-vault-600/25 transition-all flex items-center justify-center gap-2 mt-6"
              >
                <Lock className="w-4 h-4" />
                Pay {plan.price}
              </button>
            </form>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-dark-600/50">
              <div className="flex items-center gap-1.5 text-dark-400">
                <Lock className="w-3 h-3 text-vault-500" />
                <span className="text-[10px]">SSL Secured</span>
              </div>
              <div className="w-px h-3 bg-dark-600" />
              <div className="flex items-center gap-1.5 text-dark-400">
                <Shield className="w-3 h-3 text-guardian-400" />
                <span className="text-[10px]">PCI DSS Compliant</span>
              </div>
              <div className="w-px h-3 bg-dark-600" />
              <div className="flex items-center gap-1.5 text-dark-400">
                <IndianRupee className="w-3 h-3 text-dark-400" />
                <span className="text-[10px]">INR Only</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onBack}
          className="flex items-center justify-center gap-2 text-xs text-dark-400 hover:text-white transition-colors mt-4 mx-auto"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to pricing
        </button>
      </motion.div>
    </div>
  );
}
