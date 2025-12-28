const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: [true, 'Assignment ID is required'],
    index: true
  },
  sqlQuery: {
    type: String,
    trim: true,
    default: ''
  },
  lastAttempt: {
    type: Date,
    default: Date.now
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
          status: {
    type: String,
    enum: ['not_started', 'started', 'solved'],
    default: 'not_started'
  },
  attemptCount: {
    type: Number,
    default: 0,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

userProgressSchema.index({ userId: 1, assignmentId: 1 }, { unique: true });

userProgressSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const UserProgress = mongoose.model('UserProgress', userProgressSchema);

module.exports = UserProgress;

