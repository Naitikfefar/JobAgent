const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const axios = require('axios');

// Telegram notification function
async function sendTelegramNotification(chatId, message) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token || !chatId) return;
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    });
  } catch (error) {
    console.error('Telegram notification error:', error);
  }
}

// Get all applications
exports.getApplications = async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user.id })
      .sort({ appliedAt: -1 })
      .populate('jobId');
    res.json(applications);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Create new application
exports.createApplication = async (req, res) => {
  try {
    const { 
      jobId, 
      company, 
      jobTitle, 
      applyLink, 
      status, 
      coverLetterUsed, 
      resumeUsed, 
      notes 
    } = req.body;

    const application = new Application({
      userId: req.user.id,
      jobId,
      company,
      jobTitle,
      applyLink,
      status: status || 'applied',
      coverLetterUsed,
      resumeUsed,
      notes
    });

    await application.save();

    // Update related job status if jobId exists
    if (jobId) {
      await Job.findByIdAndUpdate(jobId, { status: 'applied', appliedAt: new Date() });
    }

    res.json(application);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Update application
exports.updateApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { status, notes, interviewDate, followUpDate } = req.body;
    const updatedApplication = await Application.findByIdAndUpdate(
      req.params.id,
      { status, notes, interviewDate, followUpDate },
      { new: true }
    );

    // Send Telegram notification if status is interview_scheduled
    if (status === 'interview_scheduled') {
      const user = await User.findById(req.user.id);
      if (user.telegramChatId) {
        const message = `🎉 Interview scheduled at <b>${application.company}</b> for <b>${application.jobTitle}</b>!`;
        await sendTelegramNotification(user.telegramChatId, message);
      }
    }

    res.json(updatedApplication);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Delete application
exports.deleteApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Application.findByIdAndDelete(req.params.id);
    res.json({ message: 'Application removed' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Get application stats
exports.getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const total = await Application.countDocuments({ userId });
    const applied = await Application.countDocuments({ userId, status: 'applied' });
    const underReview = await Application.countDocuments({ userId, status: 'under_review' });
    const interviewScheduled = await Application.countDocuments({ userId, status: 'interview_scheduled' });
    const rejected = await Application.countDocuments({ userId, status: 'rejected' });
    const offered = await Application.countDocuments({ userId, status: 'offered' });

    res.json({
      total,
      applied,
      under_review: underReview,
      interview_scheduled: interviewScheduled,
      rejected,
      offered
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};
