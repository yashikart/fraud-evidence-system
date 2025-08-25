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
