const User = require('../models/User');

const requirePlan = (minPlan) => async (req, res, next) => {
  const userId = req.user?.id;
  const user = await User.findById(userId);
  const plan = user?.subscription?.plan || 'free';
  const hierarchy = { free: 0, pro: 1, premium: 2 };

  console.log('[checkPlan] gate:', {
    route: req.originalUrl,
    method: req.method,
    userId,
    subscriptionPlan: user?.subscription?.plan,
    resolvedPlan: plan,
    requiredPlan: minPlan,
    hierarchyPlan: hierarchy[plan],
    hierarchyRequired: hierarchy[minPlan]
  });

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
