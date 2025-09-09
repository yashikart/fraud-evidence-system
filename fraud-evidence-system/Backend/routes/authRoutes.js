const express = require('express');
const router = express.Router();
const User = require('../models/User');
const LoginLog = require('../models/LoginLog');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// GET /api/auth/verify - Verify JWT token and return user info
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user info
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user._id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔍 Login attempt:');
    console.log('Email:', email);
    console.log('Password Provided:', !!password);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const user = await User.findOne({ email });
    console.log('✅ User lookup complete.');
    console.log('User found:', !!user);

    if (!user) {
      console.log('❌ No user found for email:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('🔑 Checking password...');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password matches:', isMatch);

    if (!isMatch) {
      console.log('❌ Invalid password.');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('🔐 Generating JWT...');
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('📝 Creating login log...');
    await LoginLog.create({
      userId: user._id,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    console.log('✅ Login successful for:', email);

    res.json({ token });

  } catch (error) {
    console.error('❌ Login error stack trace:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/register - Public registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    console.log('🔍 Registration attempt:');
    console.log('Email:', email);
    console.log('Name:', name);
    console.log('Password Provided:', !!password);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(409).json({ error: 'User already exists' });
    }

    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('👤 Creating new user...');
    const newUser = await User.create({
      email,
      password: hashedPassword,
      name: name || email.split('@')[0], // Use email prefix as default name
      role: 'user' // Default role for new registrations
    });

    console.log('🔐 Generating JWT...');
    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('📝 Creating login log...');
    await LoginLog.create({
      userId: newUser._id,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    console.log('✅ Registration successful for:', email);

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;