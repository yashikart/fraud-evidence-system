const express = require('express');
const multer = require('multer');
const router = express.Router();
const Evidence = require('../models/Evidence');
const ipfsSimulator = require('../utils/ipfsSimulator');
const evidenceContractService = require('../services/evidenceContractService');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const auditLogger = require('../middleware/auditLogger');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for ZIP files
  },
  fileFilter: (req, file, cb) => {
    // Accept any file type
    cb(null, true);
  }
});

// Upload evidence file
router.post('/upload', auth, upload.single('evidenceFile'), auditLogger, async (req, res) => {
  try {
    const { caseId, entity, description, tags, riskLevel } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!caseId || !entity) {
      return res.status(400).json({ error: 'Case ID and entity are required' });
    }

    // Store file in IPFS simulator
    const ipfsResult = await ipfsSimulator.storeFile(file.buffer, file.originalname);
    if (!ipfsResult.success) {
      return res.status(500).json({ error: 'Failed to store file: ' + ipfsResult.error });
    }

    // Store evidence hash on blockchain
    const blockchainResult = await evidenceContractService.storeEvidenceHash({
      fileHash: ipfsResult.fileHash,
      ipfsHash: ipfsResult.ipfsHash,
      caseId,
      entity,
      uploadedBy: req.user?.email || 'anonymous'
    });

    if (!blockchainResult.success) {
      return res.status(500).json({ error: 'Failed to store on blockchain: ' + blockchainResult.error });
    }

    // Save evidence record to database
    const evidence = new Evidence({
      caseId,
      entity,
      filename: `${Date.now()}_${file.originalname}`,
      originalFilename: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
      fileHash: ipfsResult.fileHash,
      ipfsHash: ipfsResult.ipfsHash,
      blockchainTxHash: blockchainResult.txHash,
      blockNumber: blockchainResult.blockNumber,
      contractAddress: blockchainResult.contractAddress,
      riskLevel: riskLevel || 'medium',
      uploadedBy: req.user?.email || 'anonymous',
      verificationStatus: 'verified',
      description,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
    });

    await evidence.save();

    res.status(201).json({
      message: 'Evidence uploaded successfully',
      evidence: {
        id: evidence._id,
        caseId: evidence.caseId,
        entity: evidence.entity,
        filename: evidence.originalFilename,
        fileHash: evidence.fileHash,
        ipfsHash: evidence.ipfsHash,
        blockchainTxHash: evidence.blockchainTxHash,
        blockNumber: evidence.blockNumber,
        uploadedAt: evidence.uploadedAt,
        verificationStatus: evidence.verificationStatus
      },
      blockchain: {
        txHash: blockchainResult.txHash,
        blockNumber: blockchainResult.blockNumber,
        contractAddress: blockchainResult.contractAddress
      }
    });

  } catch (error) {
    console.error('Error uploading evidence:', error);
    res.status(500).json({ error: 'Failed to upload evidence: ' + error.message });
  }
});

// Get evidence by case ID
router.get('/case/:caseId', auth, async (req, res) => {
  try {
    const { caseId } = req.params;
    
    const evidence = await Evidence.find({ caseId }).sort({ uploadedAt: -1 });
    
    res.json({
      success: true,
      evidence,
      count: evidence.length
    });
  } catch (error) {
    console.error('Error fetching evidence:', error);
    res.status(500).json({ error: 'Failed to fetch evidence' });
  }
});

// Get evidence by entity
router.get('/entity/:entity', auth, async (req, res) => {
  try {
    const { entity } = req.params;
    
    const evidence = await Evidence.find({ entity }).sort({ uploadedAt: -1 });
    
    res.json({
      success: true,
      evidence,
      count: evidence.length
    });
  } catch (error) {
    console.error('Error fetching evidence by entity:', error);
    res.status(500).json({ error: 'Failed to fetch evidence' });
  }
});

// Download evidence file
router.get('/download/:evidenceId', auth, async (req, res) => {
  try {
    const { evidenceId } = req.params;
    
    const evidence = await Evidence.findById(evidenceId);
    if (!evidence) {
      return res.status(404).json({ error: 'Evidence not found' });
    }

    // Retrieve file from IPFS simulator
    const fileResult = await ipfsSimulator.retrieveFile(evidence.ipfsHash);
    if (!fileResult.success) {
      return res.status(404).json({ error: 'File not found in storage' });
    }

    // Verify file integrity
    const verifyResult = await ipfsSimulator.verifyFile(evidence.ipfsHash, evidence.fileHash);
    if (!verifyResult.success || !verifyResult.isValid) {
      return res.status(400).json({ error: 'File integrity verification failed' });
    }

    res.set({
      'Content-Type': evidence.fileType,
      'Content-Disposition': `attachment; filename="${evidence.originalFilename}"`,
      'Content-Length': evidence.fileSize
    });

    res.send(fileResult.fileBuffer);

  } catch (error) {
    console.error('Error downloading evidence:', error);
    res.status(500).json({ error: 'Failed to download evidence' });
  }
});

// Verify evidence integrity
router.post('/verify/:evidenceId', auth, async (req, res) => {
  try {
    const { evidenceId } = req.params;
    
    const evidence = await Evidence.findById(evidenceId);
    if (!evidence) {
      return res.status(404).json({ error: 'Evidence not found' });
    }

    // Verify file integrity with IPFS
    const ipfsVerify = await ipfsSimulator.verifyFile(evidence.ipfsHash, evidence.fileHash);
    
    // Verify blockchain integrity
    const blockchainVerify = await evidenceContractService.verifyEvidenceIntegrity(
      evidence.fileHash, 
      evidence.blockchainTxHash
    );

    res.json({
      success: true,
      verification: {
        evidenceId: evidence._id,
        fileIntegrity: ipfsVerify,
        blockchainIntegrity: blockchainVerify,
        overallStatus: ipfsVerify.isValid && blockchainVerify.isValid ? 'verified' : 'failed'
      }
    });

  } catch (error) {
    console.error('Error verifying evidence:', error);
    res.status(500).json({ error: 'Failed to verify evidence' });
  }
});

// Get evidence trail for visualization
router.get('/trail/:caseId', auth, async (req, res) => {
  try {
    const { caseId } = req.params;
    
    const trailResult = await evidenceContractService.getEvidenceTrail(caseId);
    
    if (!trailResult.success) {
      return res.status(404).json({ error: trailResult.error });
    }

    res.json({
      success: true,
      trail: trailResult.trail,
      caseId: trailResult.caseId
    });

  } catch (error) {
    console.error('Error fetching evidence trail:', error);
    res.status(500).json({ error: 'Failed to fetch evidence trail' });
  }
});

// ADMIN ROUTES
// Get all evidence (admin only)
router.get('/admin/all', auth, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = 'uploadedAt', order = 'desc' } = req.query;
    
    const sortObj = {};
    sortObj[sort] = order === 'asc' ? 1 : -1;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const evidence = await Evidence.find({})
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Evidence.countDocuments({});
    const totalPages = Math.ceil(total / parseInt(limit));
    
    res.json({
      success: true,
      evidence,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching all evidence:', error);
    res.status(500).json({ error: 'Failed to fetch evidence' });
  }
});

// Get evidence statistics (admin only)
router.get('/admin/stats', auth, adminOnly, async (req, res) => {
  try {
    const totalEvidence = await Evidence.countDocuments({});
    const verifiedEvidence = await Evidence.countDocuments({ verificationStatus: 'verified' });
    const pendingEvidence = await Evidence.countDocuments({ verificationStatus: 'pending' });
    const failedEvidence = await Evidence.countDocuments({ verificationStatus: 'failed' });
    
    // Risk level distribution
    const riskStats = await Evidence.aggregate([
      {
        $group: {
          _id: '$riskLevel',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Cases with evidence count
    const caseStats = await Evidence.aggregate([
      {
        $group: {
          _id: '$caseId',
          evidenceCount: { $sum: 1 },
          latestUpload: { $max: '$uploadedAt' }
        }
      },
      {
        $sort: { latestUpload: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    // Get blockchain stats
    const blockchainStats = await evidenceContractService.getBlockchainStats();
    
    res.json({
      success: true,
      stats: {
        total: totalEvidence,
        verified: verifiedEvidence,
        pending: pendingEvidence,
        failed: failedEvidence,
        riskDistribution: riskStats,
        topCases: caseStats,
        blockchain: blockchainStats.success ? blockchainStats.stats : null
      }
    });
  } catch (error) {
    console.error('Error fetching evidence statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Delete evidence (admin only)
router.delete('/admin/:evidenceId', auth, adminOnly, auditLogger, async (req, res) => {
  try {
    const { evidenceId } = req.params;
    
    const evidence = await Evidence.findById(evidenceId);
    if (!evidence) {
      return res.status(404).json({ error: 'Evidence not found' });
    }
    
    // Remove from IPFS storage
    // Note: In production, you might want to keep files for audit purposes
    
    await Evidence.findByIdAndDelete(evidenceId);
    
    res.json({
      success: true,
      message: 'Evidence deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting evidence:', error);
    res.status(500).json({ error: 'Failed to delete evidence' });
  }
});

// Bulk update evidence status (admin only)
router.post('/admin/bulk-update', auth, adminOnly, auditLogger, async (req, res) => {
  try {
    const { evidenceIds, updates } = req.body;
    
    if (!evidenceIds || !Array.isArray(evidenceIds) || evidenceIds.length === 0) {
      return res.status(400).json({ error: 'Evidence IDs array is required' });
    }
    
    const result = await Evidence.updateMany(
      { _id: { $in: evidenceIds } },
      { $set: updates }
    );
    
    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} evidence records`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error bulk updating evidence:', error);
    res.status(500).json({ error: 'Failed to update evidence' });
  }
});

module.exports = router;