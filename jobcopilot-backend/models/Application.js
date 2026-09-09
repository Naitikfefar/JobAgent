const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  jobTitle: String,
  company: String,
  applyLink: String,
  source: String,
  status: {
    type: String,
    enum: ['applied', 'under_review', 'interview_scheduled', 'rejected', 'offered'],
    default: 'applied'
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  coverLetterUsed: String,
  resumeUsed: String,
  notes: String,
  interviewDate: Date,
  followUpDate: Date
});

ApplicationSchema.index({ userId: 1 });

module.exports = mongoose.model('Application', ApplicationSchema);
