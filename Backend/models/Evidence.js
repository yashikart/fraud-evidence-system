const mongoose = require("mongoose");

const EvidenceSchema = new mongoose.Schema({
  caseId: { type: String, required: true },
  entity: { type: String, required: true },
  filename: { type: String },
  originalFilename: { type: String },
  fileSize: { type: Number },
  fileType: { type: String },
  fileHash: { type: String, required: true }, // SHA-256 hash of the file
  
  // Hybrid Storage Fields
  storageHash: { type: String }, // Unique storage identifier
  ipfsHash: { type: String }, // IPFS hash for distributed storage
  s3Key: { type: String }, // S3 object key
  s3Url: { type: String }, // S3 object URL
  
  // Storage redundancy tracking
  storageLocations: {
    cache: { type: Boolean, default: false },
    s3: { type: Boolean, default: false },
    ipfs: { type: Boolean, default: false }
  },
  redundancyCount: { type: Number, default: 0 },
  
  // Blockchain fields
  blockchainTxHash: { type: String }, // Transaction hash on blockchain
  blockNumber: { type: Number }, // Block number where hash is stored
  contractAddress: { type: String }, // Smart contract address
  
  // Case management
  riskLevel: { type: String }, // e.g., 'High', 'Medium'
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: String }, // User who uploaded the evidence
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'failed'], 
    default: 'pending' 
  },
  
  // Enhanced metadata
  metadata: mongoose.Schema.Types.Mixed, // optional info
  tags: [String], // Tags for categorization
  description: { type: String }, // Description of the evidence
  
  // Storage verification
  lastVerified: { type: Date },
  integrityStatus: {
    type: String,
    enum: ['intact', 'corrupted', 'missing', 'unknown'],
    default: 'unknown'
  }
});

// Index for faster queries
EvidenceSchema.index({ caseId: 1, entity: 1 });
EvidenceSchema.index({ fileHash: 1 });
EvidenceSchema.index({ storageHash: 1 });
EvidenceSchema.index({ uploadedAt: -1 });
EvidenceSchema.index({ verificationStatus: 1 });
EvidenceSchema.index({ integrityStatus: 1 });

module.exports = mongoose.model("Evidence", EvidenceSchema);
