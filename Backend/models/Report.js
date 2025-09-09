//models/Report.js
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  entityId: {
    type: String,
    required: true,
  },
  // Optional convenience fields to align with frontend
  wallet: {
    type: String,
    default: null,
  },
  user_email: {
    type: String,
    default: null,
  },
  reason: {
    type: String,
    required: true,
  },
  severity: {
    type: Number,
    min: 1,
    max: 5,
    default: 3,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'escalated'],
    default: 'pending',
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low',
  },
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  tags: [String], // e.g. ["phishing", "botnet", "exchange fraud"]

  ipGeo: {
    lat: Number,
    lon: Number,
    city: String,
    org: String,
  },
  source: {
    type: String,
    enum: ['admin', 'contract'],
    default: null,
  },
  escalationTrail: [
    {
      type: String,
      default: [],
    },
  ],
}, {
  timestamps: true,
  versionKey: false,
});

module.exports = mongoose.model('Report', reportSchema);
