const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  source: {
    type: String,
    enum: ['Internshala', 'LinkedIn', 'Indeed', 'Naukri', 'Glassdoor']
  },
  applyLink: String,
  stipend: String,
  duration: String,
  about: String,
  matchScore: {
    type: Number,
    min: 0,
    max: 100
  },
  matchedSkills: [String],
  coverLetter: String,
  resumePath: String,
  status: {
    type: String,
    enum: ['new', 'saved', 'applied', 'interview', 'rejected', 'offered'],
    default: 'new'
  },
  foundAt: {
    type: Date,
    default: Date.now
  },
  appliedAt: Date,
  notes: String
});

JobSchema.index({ userId: 1 });

module.exports = mongoose.model('Job', JobSchema);
