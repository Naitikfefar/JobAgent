const { getCareerDashboard, recordCareerActivity } = require('../services/careerProgressService');

exports.getDashboard = async (req, res) => {
  try {
    const dashboard = await getCareerDashboard(req.user.id, { recordDailyOpen: true });
    res.json(dashboard);
  } catch (error) {
    console.error('getCareerDashboard error:', error);
    res.status(500).json({ message: 'Failed to load career progress' });
  }
};

exports.recordActivity = async (req, res) => {
  try {
    const { type, metadata } = req.body;
    if (!type) {
      return res.status(400).json({ message: 'Activity type is required' });
    }

    const result = await recordCareerActivity(req.user.id, type, metadata || {});
    const dashboard = await getCareerDashboard(req.user.id);

    res.json({
      awarded: result.awarded,
      unlocked: result.unlocked,
      dashboard
    });
  } catch (error) {
    console.error('recordCareerActivity error:', error);
    res.status(500).json({ message: 'Failed to record activity' });
  }
};
