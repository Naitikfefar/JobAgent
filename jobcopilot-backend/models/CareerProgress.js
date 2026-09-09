const mongoose = require('mongoose');

const CareerAchievementSchema = new mongoose.Schema({
  key: { type: String, required: true },
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ['resume', 'application', 'learning', 'interview', 'streak', 'career'],
    required: true
  },
  description: String,
  xpAwarded: { type: Number, default: 0 },
  unlockedAt: { type: Date, default: Date.now }
}, { _id: false });

const CareerQuestTaskSchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  target: { type: Number, required: true },
  progress: { type: Number, default: 0 },
  completed: { type: Boolean, default: false }
}, { _id: false });

const CareerProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  totalXp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  levelTitle: { type: String, default: 'Career Explorer' },
  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastActivityDate: String
  },
  counters: {
    resumeUploads: { type: Number, default: 0 },
    resumeOptimizations: { type: Number, default: 0 },
    applications: { type: Number, default: 0 },
    roadmapTasks: { type: Number, default: 0 },
    skillsCompleted: { type: Number, default: 0 },
    interviews: { type: Number, default: 0 },
    offers: { type: Number, default: 0 },
    recommendationReviews: { type: Number, default: 0 }
  },
  completedTaskIds: [{ type: String }],
  completedSkillIds: [{ type: String }],
  achievements: [CareerAchievementSchema],
  weeklyQuest: {
    weekKey: String,
    rewardXp: { type: Number, default: 700 },
    rewardClaimed: { type: Boolean, default: false },
    tasks: [CareerQuestTaskSchema]
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

CareerProgressSchema.index({ userId: 1 });

module.exports = mongoose.model('CareerProgress', CareerProgressSchema);
