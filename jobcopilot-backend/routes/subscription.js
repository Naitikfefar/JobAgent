const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const sub = require('../controllers/subscriptionController');

router.get('/plans', sub.getPlans);
router.post('/create-order', auth, sub.createOrder);
router.post('/verify-payment', auth, sub.verifyPayment);
router.get('/my-subscription', auth, sub.getSubscription);
router.post('/cancel', auth, sub.cancelSubscription);
router.post('/manual-upgrade', auth, sub.manualUpgrade);

// Test route for Razorpay (no auth)
router.get('/test-razorpay', async (req, res) => {
  try {
    console.log('Testing Razorpay...');
    const Razorpay = require('razorpay');
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    
    console.log('Instance created, creating test order...');
    
    const order = await instance.orders.create({
      amount: 100, // ₹1
      currency: 'INR',
      receipt: 'test_receipt_' + Date.now()
    });
    
    res.json({ success: true, order: order });
  } catch (error) {
    console.error('Test Razorpay error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ success: false, error: error.message, stack: error.stack });
  }
});

module.exports = router;
