const mongoose = require('mongoose');

const fanSchema = new mongoose.Schema({
  nickname: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30
  },
  team: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    trim: true,
    default: ''
  },
  state: {
    type: String,
    trim: true,
    default: ''
  },
  district: {
    type: String,
    trim: true,
    default: ''
  },
  city: {
    type: String,
    trim: true,
    default: ''
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  photoUrl: {
    type: String,
    maxlength: 200,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for geo queries and leaderboards
fanSchema.index({ location: '2dsphere' });
fanSchema.index({ team: 1, district: 1 });
fanSchema.index({ country: 1 });
fanSchema.index({ state: 1 });
fanSchema.index({ city: 1 });

module.exports = mongoose.model('Fan', fanSchema);