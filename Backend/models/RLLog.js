const mongoose = require('mongoose');

const RLLogSchema = new mongoose.Schema({
  wallet: String,
  riskScore: Number,
  confidence: Number,
  tags: [String],
  timestamp: { type: Date, default: Date.now },
  feedbackTrail: [
    {
      feedback: { type: String, enum: ["correct", "wrong"] },
      at: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model("RLLog", RLLogSchema);
