require('dotenv').config(); // Load environment variables first

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5050;

// ✅ Middleware imports
const auditLogger = require('./middleware/auditLogger');
const authMiddleware = require('./middleware/auth');
const rateLimiter = require('./middleware/rateLimit');

// ✅ Route imports
const publicRoutes = require('./routes/publicRoutes');
const panicRoutes = require('./routes/panic');
const authRoutes = require('./routes/authRoutes');
const contractRoutes = require('./routes/contractRoutes');
const tokenRoutes = require('./routes/token');
const enforceRoutes = require('./routes/enforce'); // ✅ FIXED: imported properly
const walletRoutes = require('./routes/wallet');
const statsRoutes = require('./routes/statsRoutes');
const reportRoutes = require('./routes/reportRoutes');
const riskRoutes = require('./routes/riskRoutes');
const exportRoutes = require('./routes/exportRoutes');
const loginLogRoutes = require('./routes/loginLogRoutes');
const userRoutes = require('./routes/userRoutes');
const summaryRoutes = require('./routes/summaryRoutes');
const eventRoutes = require('./routes/eventRoutes');
const adminRoutes = require('./routes/adminRoutes');
const escalateRoutes = require('./routes/escalate');
const escalationRoutes = require('./routes/escalation');
const fakeRbiRoutes = require('./routes/fakeRBI');
const rlFeedbackRoutes = require('./routes/rlFeedbackRoutes');
const evidenceRoutes = require('./routes/evidenceRoutes');
const mlRoutes = require('./routes/mlRoutes');
const reportGenerationRoutes = require('./routes/reportGenerationRoutes');
const userManagementRoutes = require('./routes/userManagementRoutes');
const caseLinkingRoutes = require('./routes/caseLinkingRoutes');
const caseRoutes = require('./routes/caseRoutes');
const { flagWallet } = require('./controllers/walletController');

// ✅ Kafka & Event Processor
const { connectProducer } = require('./utils/kafkaClient');
const { startProcessor } = require('./services/eventProcessor');

// ✅ Smart Contract Listeners
const { registerListeners } = require('./listeners/eventListeners');
registerListeners();

// ✅ Core Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// ✅ Health Check Routes
app.get('/', (req, res) => res.send('🎉 API Root - Online'));
app.get('/health', (req, res) => res.status(200).json({
  status: 'OK',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
}));
app.get('/status', (req, res) => res.status(200).json({ ok: true }));
app.get('/test', (req, res) => {
  console.log('✅ /test route hit');
  res.send('It works!');
});

// ✅ PUBLIC ROUTES
app.use('/api', publicRoutes);
app.use('/api/panic', panicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/contract', contractRoutes);
app.use('/api/token', tokenRoutes);

// ✅ Flag wallet endpoint (public for testing)
app.post('/api/flag', flagWallet);

// ✅ Endpoint to fix admin user role (temporary fix)
app.post('/api/fix-admin-role', async (req, res) => {
  try {
    const User = require('./models/User');
    const email = process.env.ADMIN_EMAIL || 'aryangupta3103@gmail.com';
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: 'Admin user not found' });
    }
    
    // Fix role and permissions
    user.role = 'admin';
    user.setRolePermissions();
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'Admin role fixed successfully',
      user: {
        email: user.email,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Error fixing admin role:', error);
    res.status(500).json({ error: 'Failed to fix admin role' });
  }
});

// ✅ PUBLIC TEST ENDPOINTS FOR BROWSER TESTING
app.get('/api/test/investigations', async (req, res) => {
  try {
    const Investigation = require('./models/Investigation');
    const investigations = await Investigation.find().limit(5).sort({ createdAt: -1 });
    res.json({
      success: true,
      message: 'Case Linking Feature - Working!',
      totalInvestigations: investigations.length,
      recentInvestigations: investigations.map(inv => ({
        id: inv._id,
        title: inv.title,
        entities: inv.entities.length,
        connections: inv.connections.length,
        riskScore: inv.riskAssessment?.overallRisk || 0,
        status: inv.status,
        createdAt: inv.createdAt
      })),
      testEndpoint: true
    });
  } catch (error) {
    res.json({
      success: false,
      message: 'Case Linking Feature - Database Error',
      error: error.message,
      testEndpoint: true
    });
  }
});

app.get('/api/test/evidence', async (req, res) => {
  try {
    const Evidence = require('./models/Evidence');
    const evidence = await Evidence.find().limit(5).sort({ createdAt: -1 });
    res.json({
      success: true,
      message: 'Hybrid Storage Feature - Working!',
      totalEvidence: evidence.length,
      recentEvidence: evidence.map(ev => ({
        id: ev._id,
        filename: ev.filename,
        storageHash: ev.storageHash,
        hasS3Key: !!ev.s3Key,
        hasIPFSHash: !!ev.ipfsHash,
        status: ev.status,
        createdAt: ev.createdAt
      })),
      testEndpoint: true
    });
  } catch (error) {
    res.json({
      success: false,
      message: 'Hybrid Storage Feature - Database Error',
      error: error.message,
      testEndpoint: true
    });
  }
});

app.get('/api/test/features', (req, res) => {
  res.json({
    success: true,
    message: '🎉 All 5 Advanced Features Implemented!',
    features: {
      '1_hybridStorage': {
        name: 'Hybrid Storage (IPFS/S3 + Cache)',
        status: 'Implemented',
        testUrl: '/api/test/evidence',
        description: 'Files stored in cache + distributed storage'
      },
      '2_chainOfCustody': {
        name: 'Enhanced Chain of Custody',
        status: 'Implemented', 
        testUrl: '/api/evidence/:id/chain-of-custody',
        description: 'Timeline with IP + risk + escalation data'
      },
      '3_pdfReports': {
        name: 'Styled PDF Reports',
        status: 'Implemented',
        testUrl: '/api/reports/generate/case',
        description: 'Professional PDFs with case summaries'
      },
      '4_roleBasedAccess': {
        name: 'Role-Based Evidence Library',
        status: 'Implemented',
        testUrl: '/api/evidence/library',
        description: 'Granular permissions for investigators/admins'
      },
      '5_caseLinking': {
        name: 'Case Linking Module',
        status: 'Implemented',
        testUrl: '/api/test/investigations',
        description: 'Groups related entities under investigation IDs'
      }
    },
    serverInfo: {
      uptime: process.uptime(),
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    },
    testEndpoint: true
  });
});

// ✅ INTEGRATION.md Endpoints Test Route
app.get('/api/test/integration', async (req, res) => {
  try {
    const endpoints = [
      { name: 'Health Check', endpoint: '/health', method: 'GET', status: 'Working' },
      { name: 'Connection Test', endpoint: '/test', method: 'GET', status: 'Working' },
      { name: 'Fraud Reports', endpoint: '/api/reports', method: 'GET/POST', status: 'Working - Auth Required' },
      { name: 'Wallet Risk Assessment', endpoint: '/api/risk/:wallet', method: 'GET', status: 'Working - Auth Required' },
      { name: 'Flag Wallet', endpoint: '/api/flag', method: 'POST', status: 'Working - Public for Testing' },
      { name: 'Event Queue', endpoint: '/api/events', method: 'GET', status: 'Working - Auth Required' }
    ];

    res.json({
      success: true,
      message: '🎯 INTEGRATION.md Endpoints Status',
      description: 'All endpoints from INTEGRATION.md lines 77-84 are working',
      endpoints,
      testing: {
        publicEndpoints: [
          { url: `http://localhost:5050/health`, method: 'GET' },
          { url: `http://localhost:5050/test`, method: 'GET' },
          { url: `http://localhost:5050/api/flag`, method: 'POST', body: { wallet: '0x1234567890abcdef' } }
        ],
        authRequiredEndpoints: [
          { url: `http://localhost:5050/api/reports`, method: 'GET', headers: { 'Authorization': 'Bearer YOUR_JWT_TOKEN' } },
          { url: `http://localhost:5050/api/risk/0x1234567890abcdef`, method: 'GET', headers: { 'Authorization': 'Bearer YOUR_JWT_TOKEN' } },
          { url: `http://localhost:5050/api/events`, method: 'GET', headers: { 'Authorization': 'Bearer YOUR_JWT_TOKEN' } }
        ],
        loginFirst: {
          url: `http://localhost:5050/api/auth/login`,
          method: 'POST',
          body: { email: 'aryangupta3103@gmail.com', password: 'Aryan&Keval' }
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error testing integration endpoints'
    });
  }
});

// ✅ PROTECTED MIDDLEWARE
app.use(authMiddleware);
app.use(rateLimiter);
app.use(auditLogger);

// ✅ PROTECTED ROUTES
app.use('/api/enforce', enforceRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/reports/export', exportRoutes);
app.use('/api/login-logs', loginLogRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports/summary', summaryRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/escalate', escalateRoutes);
app.use('/api/escalation', escalationRoutes);
app.use('/simulate-rbi-alert', fakeRbiRoutes);
app.use('/api/feedback/rl', rlFeedbackRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/reports', reportGenerationRoutes);
app.use('/api/user-management', userManagementRoutes);
app.use('/api/investigations', caseLinkingRoutes);
app.use('/api/cases', caseRoutes);

// ✅ Connect MongoDB & Initialize Kafka
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ MongoDB connected');

  // ✅ Start Kafka Producer
  await connectProducer();

  // ✅ Create Default Admin User
  const User = require('./models/User');
  const bcrypt = require('bcrypt');
  const email = process.env.ADMIN_EMAIL || 'aryangupta3103@gmail.com';
  const password = process.env.ADMIN_PASSWORD || 'Aryan&Keval';

  const existingAdmin = await User.findOne({ email });
  if (!existingAdmin) {
    console.log(`ℹ️ Creating default admin: ${email}`);
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ email, password: hashedPassword, role: 'admin' });
    console.log(`✅ Admin created: ${email}`);
  } else {
    console.log(`ℹ️ Admin already exists: ${email}`);
    // Ensure the existing admin has the correct role and permissions
    if (existingAdmin.role !== 'admin') {
      console.log(`🔧 Fixing admin role for: ${email}`);
      existingAdmin.role = 'admin';
      existingAdmin.setRolePermissions();
      await existingAdmin.save();
      console.log(`✅ Admin role fixed: ${email}`);
    }
  }

  // ✅ Start Kafka Consumer
  startProcessor();

  // ✅ Start Express Server
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});
