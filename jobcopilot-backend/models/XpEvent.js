const mongoose = require('mongoose');

const XpEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventKey: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  xp: {
    type: Number,
    required: true
  },
  metadata: {
    type: Object,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

XpEventSchema.index({ userId: 1, eventKey: 1 }, { unique: true });
XpEventSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('XpEvent', XpEventSchema);
