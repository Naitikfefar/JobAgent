import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Zap, Crown, Star, Shield } from 'lucide-react';
import { createOrder, verifyPayment, getMySubscription, manualUpgrade } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function Pricing() {
  const [currentPlan, setCurrentPlan] = useState('free');
  const [loading, setLoading] = useState(true);
  const [payingFor, setPayingFor] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadSubscription = async () => {
      try {
        const res = await getMySubscription();
        setCurrentPlan(res.data.plan);
      } catch (err) {
        console.error('Failed to load subscription:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadSubscription();
    }
  }, [user]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleUpgrade = async (planName: string) => {
    setPayingFor(planName);
    try {
      const orderRes = await createOrder(planName);
      const { orderId, amount, currency, keyId } = orderRes.data;

      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'JobCopilot',
        description: `${planName} Plan Subscription`,
        image: '/logo.png',
        order_id: orderId,
        handler: async (response: any) => {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: planName
            });
            setCurrentPlan(planName);
            setShowSuccess(true);
          } catch (err) {
            alert('Payment verification failed. Contact support.');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: { color: '#6C63FF' }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Payment failed:', err);
    } finally {
      setPayingFor(null);
    }
  };

  // Manual upgrade for testing
  const handleManualUpgrade = async (planName: string) => {
    try {
      const res = await manualUpgrade(planName);
      alert(res.data.message);

      const subRes = await getMySubscription();
      setCurrentPlan(subRes.data.plan);
      setShowSuccess(true);
    } catch (err) {
      console.error('Manual upgrade failed:', err);
      alert('Manual upgrade failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-[#0A0A0F] dark:to-[#0F0F16] py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Simple Pricing</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">Choose the perfect plan for your job search</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Free Plan */}
          <div className="bg-white dark:bg-[#1A1A2E] border border-slate-200 dark:border-[#2A2A3E] rounded-2xl p-8 shadow-sm">
            <div className="mb-6">
              <Star className="w-10 h-10 text-slate-400 mb-2" />
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Free</h3>
                {currentPlan === 'free' && (
                  <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full">
                    Current Plan
                  </span>
                )}
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                ₹0
                <span className="text-base font-normal text-slate-500">/month</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Check className="w-5 h-5 text-green-500" />
                5 jobs per day
              </li>
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Check className="w-5 h-5 text-green-500" />
                3 AI resumes per month
              </li>
              <li className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                <span className="w-5 h-5 flex items-center justify-center">✗</span>
                Cover letters
              </li>
              <li className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                <span className="w-5 h-5 flex items-center justify-center">✗</span>
                Interview preparation
              </li>
              <li className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                <span className="w-5 h-5 flex items-center justify-center">✗</span>
                Telegram alerts
              </li>
              <li className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                <span className="w-5 h-5 flex items-center justify-center">✗</span>
                Skill gap analysis
              </li>
            </ul>
            <button
              disabled
              className="w-full py-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed font-medium"
            >
              {currentPlan === 'free' ? 'Current Plan' : 'Downgrade'}
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-white dark:bg-[#1A1A2E] border-2 border-purple-500 rounded-2xl p-8 shadow-lg transform scale-105">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-10 h-10 text-purple-500" />
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-full">
                  Most Popular
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Pro</h3>
                {currentPlan === 'pro' && (
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 text-xs font-semibold rounded-full">
                    Current Plan
                  </span>
                )}
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                ₹499
                <span className="text-base font-normal text-slate-500">/month</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Check className="w-5 h-5 text-green-500" />
                Unlimited jobs daily
              </li>
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Check className="w-5 h-5 text-green-500" />
                Unlimited AI resumes
              </li>
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Check className="w-5 h-5 text-green-500" />
                AI cover letters
              </li>
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Check className="w-5 h-5 text-green-500" />
                Interview preparation (10 Q&A per job)
              </li>
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Check className="w-5 h-5 text-green-500" />
                Telegram notifications
              </li>
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Check className="w-5 h-5 text-green-500" />
                Skill gap analysis
              </li>
              <li className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                <span className="w-5 h-5 flex items-center justify-center">✗</span>
                Priority support
              </li>
              <li className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                <span className="w-5 h-5 flex items-center justify-center">✗</span>
                LinkedIn optimizer
              </li>
            </ul>
            {currentPlan === 'pro' ? (
              <button
                disabled
                className="w-full py-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed font-medium"
              >
                Current Plan
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleUpgrade('pro')}
                  disabled={payingFor === 'pro'}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-70 disabled:cursor-not-allowed mb-2"
                >
                  {payingFor === 'pro' ? 'Processing...' : 'Upgrade to Pro'}
                </button>
                <button
                  onClick={() => handleManualUpgrade('pro')}
                  className="w-full py-2 rounded-lg bg-slate-600 text-white text-sm font-medium hover:bg-slate-700 transition-all"
                >
                  Manual Upgrade (Test)
                </button>
              </>
            )}
          </div>

          {/* Premium Plan */}
          <div className="bg-white dark:bg-[#1A1A2E] border border-slate-200 dark:border-[#2A2A3E] rounded-2xl p-8 shadow-sm">
            <div className="mb-6">
              <Crown className="w-10 h-10 text-yellow-500 mb-2" />
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Premium</h3>
                {currentPlan === 'premium' && (
                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-semibold rounded-full">
                    Current Plan
                  </span>
                )}
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                ₹999
                <span className="text-base font-normal text-slate-500">/month</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Check className="w-5 h-5 text-green-500" />
                Everything in Pro
              </li>
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Check className="w-5 h-5 text-green-500" />
                Priority support (24hr response)
              </li>
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Check className="w-5 h-5 text-green-500" />
                LinkedIn profile optimizer
              </li>
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Check className="w-5 h-5 text-green-500" />
                Weekly progress reports
              </li>
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Check className="w-5 h-5 text-green-500" />
                Early access to new features
              </li>
            </ul>
            {currentPlan === 'premium' ? (
              <button
                disabled
                className="w-full py-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed font-medium"
              >
                Current Plan
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleUpgrade('premium')}
                  disabled={payingFor === 'premium'}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-medium hover:from-yellow-600 hover:to-yellow-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed mb-2"
                >
                  {payingFor === 'premium' ? 'Processing...' : 'Go Premium'}
                </button>
                <button
                  onClick={() => handleManualUpgrade('premium')}
                  className="w-full py-2 rounded-lg bg-slate-600 text-white text-sm font-medium hover:bg-slate-700 transition-all"
                >
                  Manual Upgrade (Test)
                </button>
              </>
            )}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="text-center space-y-4 mb-12">
          <div className="flex items-center justify-center gap-8 text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              100% secure payments via Razorpay
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5" />
              Cancel anytime, no questions asked
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5" />
              7-day refund policy
            </div>
          </div>
          <img
            src="https://razorpay.com/favicon.png"
            alt="Razorpay"
            className="w-8 h-8 mx-auto opacity-70"
          />
        </div>

        {/* FAQ Section */}
        <div className="bg-white dark:bg-[#1A1A2E] border border-slate-200 dark:border-[#2A2A3E] rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6 max-w-2xl mx-auto">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Can I cancel anytime?</h4>
              <p className="text-slate-600 dark:text-slate-400">Yes, cancel from your profile. Access continues until end of billing period.</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Is my payment secure?</h4>
              <p className="text-slate-600 dark:text-slate-400">Yes, all payments are processed by Razorpay with bank-level security.</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">What if I need help?</h4>
              <p className="text-slate-600 dark:text-slate-400">Pro users get email support. Premium users get priority 24-hour support.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1A2E] rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Welcome to JobCopilot {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}!
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Your account has been upgraded. Enjoy unlimited access to all {currentPlan} features.
            </p>
            <Link
              to="/jobs"
              onClick={() => setShowSuccess(false)}
              className="btn-primary block w-full"
            >
              Start Finding Jobs
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
