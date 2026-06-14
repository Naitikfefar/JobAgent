const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');

let razorpayInstance = null;

const getRazorpayInstance = () => {
  if (!razorpayInstance) {
    console.log('Initializing Razorpay instance');
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
  return razorpayInstance;
};

const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: {
      jobsPerDay: 5,
      resumesPerMonth: 3,
      coverLetters: false,
      interviewPrep: false,
      telegramAlerts: false,
      skillGapAnalysis: false,
      prioritySupport: false
    }
  },
  pro: {
    name: 'Pro',
    price: 49900, // in paise (₹499)
    features: {
      jobsPerDay: -1, // unlimited
      resumesPerMonth: -1,
      coverLetters: true,
      interviewPrep: true,
      telegramAlerts: true,
      skillGapAnalysis: true,
      prioritySupport: false
    }
  },
  premium: {
    name: 'Premium',
    price: 99900, // ₹999
    features: {
      jobsPerDay: -1,
      resumesPerMonth: -1,
      coverLetters: true,
      interviewPrep: true,
      telegramAlerts: true,
      skillGapAnalysis: true,
      prioritySupport: true,
      linkedinOptimizer: true,
      weeklyReport: true
    }
  }
};

exports.getPlans = (req, res) => {
  res.json(PLANS);
};

exports.createOrder = async (req, res) => {
  try {
    console.log('createOrder called with plan:', req.body.plan);
    console.log('Razorpay key ID:', process.env.RAZORPAY_KEY_ID ? 'set' : 'not set');
    console.log('Razorpay secret:', process.env.RAZORPAY_KEY_SECRET ? 'set' : 'not set');
    console.log('User ID:', req.user.id);
    
    const { plan } = req.body;
    if (!PLANS[plan] || plan === 'free') {
      return res.status(400).json({ message: 'Invalid plan' });
    }

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: PLANS[plan].price,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`
    });

    console.log('Order created successfully:', order.id);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      plan: plan,
      planDetails: PLANS[plan]
    });
  } catch (error) {
    console.error('Order creation failed with error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Payment order creation failed', 
      error: error.message 
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // Update user subscription
    const user = await User.findById(req.user.id);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

    user.subscription = {
      plan: plan,
      startDate: new Date(),
      endDate: endDate,
      isActive: true,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id
    };

    await user.save();

    res.json({
      message: 'Payment successful! Welcome to ' + PLANS[plan].name,
      subscription: user.subscription
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Payment verification failed' });
  }
};

exports.getSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const plan = user.subscription?.plan || 'free';
    
    // Check if subscription expired
    if (user.subscription?.endDate && new Date() > user.subscription.endDate) {
      user.subscription.plan = 'free';
      user.subscription.isActive = false;
      await user.save();
    }

    res.json({
      plan: user.subscription?.plan || 'free',
      isActive: user.subscription?.isActive || false,
      endDate: user.subscription?.endDate,
      features: PLANS[plan]?.features || PLANS.free.features
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.subscription.isActive = false;
    await user.save();
    res.json({ message: 'Subscription cancelled. Access until end of billing period.' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Manual upgrade for testing (no payment required)
exports.manualUpgrade = async (req, res) => {
  try {
    const { plan } = req.body;
    if (!PLANS[plan] || plan === 'free') {
      return res.status(400).json({ message: 'Invalid plan' });
    }

    const user = await User.findById(req.user.id);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

    user.subscription = {
      plan: plan,
      startDate: new Date(),
      endDate: endDate,
      isActive: true
    };

    await user.save();

    res.json({
      message: `Successfully upgraded to ${PLANS[plan].name} (manual upgrade)!`,
      subscription: user.subscription
    });
  } catch (error) {
    console.error('Manual upgrade error:', error);
    res.status(500).json({ message: 'Manual upgrade failed' });
  }
};
