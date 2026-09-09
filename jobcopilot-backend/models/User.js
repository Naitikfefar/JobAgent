const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  },
  phone: {
    type: String
  },
  profile: {
    currentRole: String,
    experienceYears: {
      type: Number,
      default: 0
    },
    skills: [String],
    preferredRoles: [String],
    preferredLocations: [String],
    remoteOnly: {
      type: Boolean,
      default: true
    },
    expectedSalary: String,
    bio: String
  },
  resume: {
    originalName: String,
    filePath: String,
    uploadedAt: Date,
    parsedText: String
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'pro', 'premium'],
      default: 'free'
    },
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: false
    },
    razorpayOrderId: String,
    razorpayPaymentId: String
  },
  telegramChatId: {
    type: String
  },
  jobPreferences: {
    searchKeywords: [String],
    excludeKeywords: [String],
    minStipend: Number,
    jobTypes: [String]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date
  }
  ,
  // Gamification fields
  xp: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  achievements: [
    {
      id: String,
      name: String,
      description: String,
      points: Number,
      earnedAt: Date
    }
  ],
  xpHistory: [
    {
      amount: Number,
      reason: String,
      date: { type: Date, default: Date.now }
    }
  ],
  streak: {
    currentStreakDays: { type: Number, default: 0 },
    lastActiveDate: Date
  },
  quests: [
    {
      questId: String,
      title: String,
      progress: { type: Number, default: 0 },
      target: Number,
      rewardXp: Number,
      completed: { type: Boolean, default: false }
    }
  ]
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
