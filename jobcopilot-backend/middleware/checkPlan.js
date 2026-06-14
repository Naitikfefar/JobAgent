const User = require('../models/User');

const requirePlan = (minPlan) => async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const plan = user.subscription?.plan || 'free';
  const hierarchy = { free: 0, pro: 1, premium: 2 };
  
  if (hierarchy[plan] >= hierarchy[minPlan]) {
    return next();
  }
  
  return res.status(403).json({
    message: `This feature requires ${minPlan} plan`,
    currentPlan: plan,
    requiredPlan: minPlan,
    upgradeUrl: '/pricing'
  });
};

module.exports = { requirePlan };
