const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// PATCH /api/users/:id/activate - Enable/disable user
router.patch('/:id/activate', authMiddleware, async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      email: user.email,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

module.exports = router;
