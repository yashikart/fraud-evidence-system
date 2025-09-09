const fs = require('fs');
const path = require('path');
const axios = require('axios');
const APILogger = require('./apiLogger');

class MLDetectionService {
  constructor() {
    // Initialize transaction data as empty array - will be loaded from API
    this.transactionData = [];
    this.apiUrlPrimary = 'http://192.168.0.80:8080/api/transaction-data';
    this.apiUrlFallback = 'http://192.168.0.68:8080/api/transaction-data';
    this.lastUsedApiUrl = this.apiUrlPrimary;
    this.lastDataFetch = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
    
    // Initialize API logger
    this.apiLogger = new APILogger();
    
    // Known suspicious patterns and addresses
    this.suspiciousPatterns = {
      rapidDumping: { threshold: 5, timeWindow: 300 }, // 5 transactions in 5 minutes
      largeTransfers: { threshold: 100 }, // Amounts > 100 BHX
      flashLoan: { timeWindow: 60 }, // Multiple transactions within 1 minute
      phishingIndicators: ['0x000', '0x111', '0x999'], // Common phishing patterns
    };

    // Risk scoring weights
    this.riskWeights = {
      rapidDumping: 0.3,
      largeAmount: 0.25,
      flashLoan: 0.2,
      phishingPattern: 0.15,
      reportHistory: 0.1
    };
  }

  // Load transaction data from external API
  async loadTransactionData(forceRefresh = false) {
    try {
      // Check if we have cached data and it's still fresh
      if (!forceRefresh && this.transactionData.length > 0 && this.lastDataFetch) {
        const timeSinceLastFetch = Date.now() - this.lastDataFetch;
        if (timeSinceLastFetch < this.cacheTimeout) {
          // Log cache usage
          this.apiLogger.logCacheUsage('hit', { 
            length: this.transactionData.length,
            cacheAge: Math.round(timeSinceLastFetch / 1000) + ' seconds'
          });
          
          console.log(`🔄 Using cached transaction data (${this.transactionData.length} transactions)`);
          return this.transactionData;
        }
      }

      console.log('📡 Fetching fresh transaction data from external API...');
      
      const requestData = {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Fraud-Detection-ML-Service/1.0'
        }
      };

      const fetchFrom = async (url) => {
        this.apiLogger.apiUrl = url;
        console.log(`- API URL: ${url}`);
        // Log API call attempt
        this.apiLogger.logAPICall(requestData);
        const startTime = Date.now();
        const response = await axios.get(url, requestData);
        if (response.status === 200 && Array.isArray(response.data)) {
          const responseTime = Date.now() - startTime;
          this.transactionData = response.data;
          this.lastDataFetch = Date.now();
          this.lastUsedApiUrl = url;
          // Log successful API response
          this.apiLogger.logAPISuccess({
            status: response.status,
            statusText: response.statusText,
            responseTime: responseTime,
            data: response.data,
            headers: response.headers
          });
          this.apiLogger.writeLog(`[API_ENDPOINT_USED] ${new Date().toISOString()} - URL: ${url}\n${'='.repeat(50)}\n`);
          console.log(`✅ Successfully loaded ${this.transactionData.length} transactions from API`);
          return this.transactionData;
        }
        throw new Error(`Invalid API response: Status ${response.status}`);
      };

      // Try primary endpoint first, then fallback
      try {
        return await fetchFrom(this.apiUrlPrimary);
      } catch (primaryErr) {
        console.error('Primary endpoint failed, trying fallback:', primaryErr.message);
        try {
          const data = await fetchFrom(this.apiUrlFallback);
          // Log fallback to old endpoint
          this.apiLogger.logFallback('old-endpoint', this.transactionData);
          return data;
        } catch (fallbackErr) {
          console.error('Fallback endpoint also failed:', fallbackErr.message);
          throw fallbackErr;
        }
      }
      
    } catch (error) {
      console.error('❌ Error loading transaction data from API:', error.message);
      
      // Log API error
      this.apiLogger.logAPIError(error, error.response);
      
      // Fallback: try to load from local backup file if API fails
      if (this.transactionData.length === 0) {
        console.log('🔄 Attempting to load from local backup...');
        try {
          const backupPath = path.join(__dirname, '../../bhx_transactions_backup.json');
          if (fs.existsSync(backupPath)) {
            const data = fs.readFileSync(backupPath, 'utf8');
            this.transactionData = JSON.parse(data);
            
            // Log fallback usage
            this.apiLogger.logFallback('backup', this.transactionData);
            
            console.log(`📋 Loaded ${this.transactionData.length} transactions from local backup`);
            return this.transactionData;
          }
        } catch (backupError) {
          console.error('❌ Backup file also failed:', backupError.message);
        }
      }
      
      // If we have cached data, use it despite the error
      if (this.transactionData.length > 0) {
        // Log cache usage
        this.apiLogger.logCacheUsage('fallback', this.transactionData);
        
        console.log(`⚠️ Using stale cached data (${this.transactionData.length} transactions)`);
        return this.transactionData;
      }
      
      // Last resort: return empty array
      console.error('❌ No transaction data available - analysis will be limited');
      return [];
    }
  }

  /**
   * Main ML analysis function
   * @param {string} address - Wallet address to analyze
   * @param {string} reason - Report reason
   * @param {string} userEmail - Reporter email
   * @returns {Object} ML analysis result
   */
  async analyzeWallet(address, reason, userEmail) {
    console.log(`🤖 Starting ML analysis for wallet: ${address}`);
    
    // Ensure we have fresh transaction data
    await this.loadTransactionData();
    
    // Get wallet transactions for logging
    const walletTransactions = this.getWalletTransactions(address);
    
    // Log ML analysis request
    this.apiLogger.logMLAnalysis(address, walletTransactions.length);
    
    try {
      // Get wallet transactions (already retrieved for logging)
      // const walletTransactions = this.getWalletTransactions(address);
      
      // Perform various analyses
      const rapidDumpAnalysis = this.detectRapidDumping(walletTransactions);
      const largeTransferAnalysis = this.detectLargeTransfers(walletTransactions);
      const flashLoanAnalysis = this.detectFlashLoans(walletTransactions);
      const phishingAnalysis = this.detectPhishingPatterns(address, reason);
      const reportHistoryAnalysis = this.analyzeReportHistory(address, reason);

      // Calculate composite risk score
      const riskScore = this.calculateRiskScore({
        rapidDumping: rapidDumpAnalysis.score,
        largeAmount: largeTransferAnalysis.score,
        flashLoan: flashLoanAnalysis.score,
        phishingPattern: phishingAnalysis.score,
        reportHistory: reportHistoryAnalysis.score
      });

      // Determine violation type and recommended action
      const violation = this.determineViolationType(
        rapidDumpAnalysis,
        largeTransferAnalysis,
        flashLoanAnalysis,
        phishingAnalysis,
        reportHistoryAnalysis
      );

      const recommendedAction = this.getRecommendedAction(riskScore, violation);

      const result = {
        address,
        violation,
        score: Math.round(riskScore * 100) / 100,
        recommended_action: recommendedAction,
        analysis_details: {
          rapid_dumping: rapidDumpAnalysis,
          large_transfers: largeTransferAnalysis,
          flash_loans: flashLoanAnalysis,
          phishing_indicators: phishingAnalysis,
          report_history: reportHistoryAnalysis
        },
        transaction_count: walletTransactions.length,
        analyzed_at: new Date().toISOString(),
        analyzed_by: userEmail
      };

      console.log(`✅ ML Analysis completed for ${address}: ${violation} (Score: ${result.score})`);
      return result;

    } catch (error) {
      console.error('Error in ML analysis:', error);
      return this.getDefaultAnalysis(address, error.message);
    }
  }

  getWalletTransactions(address) {
    // Find transactions where wallet is sender or receiver
    if (!this.transactionData || this.transactionData.length === 0) {
      console.log('⚠️ No transaction data available for analysis');
      return [];
    }
    
    const transactions = this.transactionData.filter(tx => 
      tx.from_address === address || tx.to_address === address
    );
    
    console.log(`📊 Found ${transactions.length} transactions for wallet ${address.substring(0, 16)}...`);
    return transactions;
  }

  detectRapidDumping(transactions) {
    if (transactions.length < 2) {
      return { detected: false, score: 0, details: 'Insufficient transaction history' };
    }

    // Sort by timestamp
    const sorted = transactions.sort((a, b) => a.timestamp - b.timestamp);
    let rapidSequences = 0;
    let maxSequenceLength = 0;

    for (let i = 0; i < sorted.length - 1; i++) {
      let sequenceLength = 1;
      let j = i + 1;
      
      while (j < sorted.length && 
             (sorted[j].timestamp - sorted[i].timestamp) < this.suspiciousPatterns.rapidDumping.timeWindow) {
        sequenceLength++;
        j++;
      }

      if (sequenceLength >= this.suspiciousPatterns.rapidDumping.threshold) {
        rapidSequences++;
        maxSequenceLength = Math.max(maxSequenceLength, sequenceLength);
      }
    }

    const detected = rapidSequences > 0;
    const score = detected ? Math.min(rapidSequences * 0.2 + maxSequenceLength * 0.1, 1) : 0;

    return {
      detected,
      score,
      sequences: rapidSequences,
      max_sequence_length: maxSequenceLength,
      details: detected ? `Found ${rapidSequences} rapid dumping sequences` : 'No rapid dumping detected'
    };
  }

  detectLargeTransfers(transactions) {
    const largeTransfers = transactions.filter(tx => 
      tx.amount > this.suspiciousPatterns.largeTransfers.threshold
    );

    const detected = largeTransfers.length > 0;
    const averageAmount = largeTransfers.reduce((sum, tx) => sum + tx.amount, 0) / (largeTransfers.length || 1);
    const score = detected ? Math.min(largeTransfers.length * 0.15 + (averageAmount / 200), 1) : 0;

    return {
      detected,
      score,
      count: largeTransfers.length,
      average_amount: Math.round(averageAmount),
      details: detected ? `Found ${largeTransfers.length} large transfers (avg: ${Math.round(averageAmount)} BHX)` : 'No large transfers detected'
    };
  }

  detectFlashLoans(transactions) {
    if (transactions.length < 3) {
      return { detected: false, score: 0, details: 'Insufficient transactions for flash loan detection' };
    }

    const sorted = transactions.sort((a, b) => a.timestamp - b.timestamp);
    let flashLoanPatterns = 0;

    for (let i = 0; i < sorted.length - 2; i++) {
      const timeDiff1 = sorted[i + 1].timestamp - sorted[i].timestamp;
      const timeDiff2 = sorted[i + 2].timestamp - sorted[i + 1].timestamp;
      
      if (timeDiff1 < this.suspiciousPatterns.flashLoan.timeWindow && 
          timeDiff2 < this.suspiciousPatterns.flashLoan.timeWindow) {
        flashLoanPatterns++;
      }
    }

    const detected = flashLoanPatterns > 0;
    const score = detected ? Math.min(flashLoanPatterns * 0.25, 1) : 0;

    return {
      detected,
      score,
      patterns: flashLoanPatterns,
      details: detected ? `Found ${flashLoanPatterns} potential flash loan patterns` : 'No flash loan patterns detected'
    };
  }

  detectPhishingPatterns(address, reason) {
    const reasonLower = reason.toLowerCase();
    let phishingScore = 0;

    // Check address patterns
    const hasPhishingPattern = this.suspiciousPatterns.phishingIndicators.some(pattern => 
      address.toLowerCase().includes(pattern)
    );

    // Check reason keywords
    const phishingKeywords = ['phish', 'scam', 'fake', 'impersonat', 'malicious', 'fraud', 'steal'];
    const keywordMatches = phishingKeywords.filter(keyword => reasonLower.includes(keyword));

    if (hasPhishingPattern) phishingScore += 0.3;
    phishingScore += keywordMatches.length * 0.2;

    const detected = phishingScore > 0;
    const score = Math.min(phishingScore, 1);

    return {
      detected,
      score,
      address_pattern: hasPhishingPattern,
      keyword_matches: keywordMatches,
      details: detected ? `Phishing indicators found: ${keywordMatches.join(', ')}` : 'No phishing patterns detected'
    };
  }

  analyzeReportHistory(address, reason) {
    // Simulate report history analysis
    // In real implementation, this would query database
    const simulatedReports = Math.floor(Math.random() * 5);
    const detected = simulatedReports > 0;
    const score = detected ? Math.min(simulatedReports * 0.2, 1) : 0;

    return {
      detected,
      score,
      previous_reports: simulatedReports,
      details: detected ? `Found ${simulatedReports} previous reports` : 'No previous reports found'
    };
  }

  calculateRiskScore(scores) {
    return (
      scores.rapidDumping * this.riskWeights.rapidDumping +
      scores.largeAmount * this.riskWeights.largeAmount +
      scores.flashLoan * this.riskWeights.flashLoan +
      scores.phishingPattern * this.riskWeights.phishingPattern +
      scores.reportHistory * this.riskWeights.reportHistory
    );
  }

  determineViolationType(rapidDump, largeTransfer, flashLoan, phishing, reportHistory) {
    const violations = [];

    if (rapidDump.detected) violations.push('Rapid token dump');
    if (largeTransfer.detected) violations.push('Large suspicious transfers');
    if (flashLoan.detected) violations.push('Flash loan manipulation');
    if (phishing.detected) violations.push('Phishing activity');
    if (reportHistory.detected) violations.push('Repeat offender');

    return violations.length > 0 ? violations.join(', ') : 'Low risk activity';
  }

  getRecommendedAction(riskScore, violation) {
    if (riskScore >= 0.8) return 'freeze';
    if (riskScore >= 0.6) return 'investigate';
    if (riskScore >= 0.4) return 'monitor';
    return 'no_action';
  }

  getDefaultAnalysis(address, error) {
    return {
      address,
      violation: 'Analysis error',
      score: 0.5,
      recommended_action: 'manual_review',
      error: error,
      analyzed_at: new Date().toISOString()
    };
  }
}

module.exports = MLDetectionService;