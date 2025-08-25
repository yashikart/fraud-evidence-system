// services/evidenceContractService.js
const crypto = require('crypto');

class EvidenceContractService {
  constructor() {
    this.contractAddress = "0x742d35Cc6761C65532534444";
    this.blockchainLedger = new Map(); // Simulate blockchain storage
    this.currentBlockNumber = 1000; // Starting block number
  }

  // Simulate storing evidence hash on blockchain
  async storeEvidenceHash(evidenceData) {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

      const { fileHash, ipfsHash, caseId, entity, uploadedBy } = evidenceData;

      // Generate transaction hash
      const txData = `${fileHash}${ipfsHash}${caseId}${Date.now()}`;
      const txHash = "0x" + crypto.createHash('sha256').update(txData).digest('hex');

      // Increment block number
      this.currentBlockNumber++;

      // Create block entry
      const blockEntry = {
        txHash,
        blockNumber: this.currentBlockNumber,
        contractAddress: this.contractAddress,
        evidenceHash: fileHash,
        ipfsHash,
        caseId,
        entity,
        uploadedBy,
        timestamp: new Date().toISOString(),
        gasUsed: Math.floor(Math.random() * 50000) + 21000,
        status: 'confirmed'
      };

      // Store in simulated blockchain
      this.blockchainLedger.set(txHash, blockEntry);

      return {
        success: true,
        txHash,
        blockNumber: this.currentBlockNumber,
        contractAddress: this.contractAddress,
        confirmationMessage: "Evidence hash stored on blockchain successfully",
        gasUsed: blockEntry.gasUsed
      };
    } catch (error) {
      console.error('Error storing evidence hash on blockchain:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Retrieve evidence from blockchain by transaction hash
  async getEvidenceByTxHash(txHash) {
    try {
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

      const blockEntry = this.blockchainLedger.get(txHash);
      if (!blockEntry) {
        return {
          success: false,
          error: 'Transaction not found'
        };
      }

      return {
        success: true,
        evidence: blockEntry
      };
    } catch (error) {
      console.error('Error retrieving evidence from blockchain:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get evidence by case ID
  async getEvidenceByCaseId(caseId) {
    try {
      await new Promise(resolve => setTimeout(resolve, 150));

      const evidenceList = [];
      for (const [txHash, blockEntry] of this.blockchainLedger.entries()) {
        if (blockEntry.caseId === caseId) {
          evidenceList.push({ txHash, ...blockEntry });
        }
      }

      return {
        success: true,
        evidenceList,
        count: evidenceList.length
      };
    } catch (error) {
      console.error('Error retrieving evidence by case ID:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify evidence integrity on blockchain
  async verifyEvidenceIntegrity(fileHash, txHash) {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      const blockEntry = this.blockchainLedger.get(txHash);
      if (!blockEntry) {
        return {
          success: false,
          error: 'Transaction not found'
        };
      }

      const isValid = blockEntry.evidenceHash === fileHash;
      
      return {
        success: true,
        isValid,
        storedHash: blockEntry.evidenceHash,
        providedHash: fileHash,
        blockNumber: blockEntry.blockNumber,
        timestamp: blockEntry.timestamp
      };
    } catch (error) {
      console.error('Error verifying evidence integrity:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get blockchain statistics
  async getBlockchainStats() {
    try {
      const totalTransactions = this.blockchainLedger.size;
      const latestBlock = this.currentBlockNumber;
      
      // Calculate evidence by case
      const caseStats = new Map();
      for (const blockEntry of this.blockchainLedger.values()) {
        const count = caseStats.get(blockEntry.caseId) || 0;
        caseStats.set(blockEntry.caseId, count + 1);
      }

      return {
        success: true,
        stats: {
          totalTransactions,
          latestBlock,
          contractAddress: this.contractAddress,
          caseCount: caseStats.size,
          casesWithEvidence: Array.from(caseStats.entries()).map(([caseId, count]) => ({
            caseId,
            evidenceCount: count
          }))
        }
      };
    } catch (error) {
      console.error('Error getting blockchain stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create evidence trail for visualization
  async getEvidenceTrail(caseId) {
    try {
      const evidenceResult = await this.getEvidenceByCaseId(caseId);
      if (!evidenceResult.success) {
        return evidenceResult;
      }

      const trail = evidenceResult.evidenceList
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .map((evidence, index) => ({
          step: index + 1,
          type: 'Evidence Upload',
          description: `Evidence hash stored for entity: ${evidence.entity}`,
          hash: evidence.evidenceHash,
          txHash: evidence.txHash,
          blockNumber: evidence.blockNumber,
          timestamp: evidence.timestamp,
          status: 'confirmed'
        }));

      return {
        success: true,
        trail,
        caseId
      };
    } catch (error) {
      console.error('Error creating evidence trail:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new EvidenceContractService();