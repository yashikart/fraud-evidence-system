const mongoose = require("mongoose");

const EvidenceSchema = new mongoose.Schema({
  caseId: { type: String, required: true },
  entity: { type: String, required: true },
  filename: { type: String },
  originalFilename: { type: String },
  fileSize: { type: Number },
  fileType: { type: String },
  fileHash: { type: String, required: true }, // SHA-256 hash of the file
  ipfsHash: { type: String }, // IPFS hash for distributed storage
  blockchainTxHash: { type: String }, // Transaction hash on blockchain
  blockNumber: { type: Number }, // Block number where hash is stored
  contractAddress: { type: String }, // Smart contract address
  riskLevel: { type: String }, // e.g., 'High', 'Medium'
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: String }, // User who uploaded the evidence
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'failed'], 
    default: 'pending' 
  },
  metadata: mongoose.Schema.Types.Mixed, // optional info
  tags: [String], // Tags for categorization
  description: { type: String }, // Description of the evidence
});

// Index for faster queries
EvidenceSchema.index({ caseId: 1, entity: 1 });
EvidenceSchema.index({ fileHash: 1 });
EvidenceSchema.index({ uploadedAt: -1 });

module.exports = mongoose.model("Evidence", EvidenceSchema);
