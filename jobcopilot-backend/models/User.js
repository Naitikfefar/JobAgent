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
      default: true
    }
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
