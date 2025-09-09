const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const auth = require('../middleware/auth');
const { adminOnly, logAccess } = require('../middleware/roleBasedAccess');
const Report = require('../models/Report');

const dumpsDir = path.join(__dirname, '..', 'dumps');

// ✅ Escalate report by wallet (Admin only)
router.post('/escalate', auth, adminOnly, logAccess('admin_escalate'), async (req, res) => {
  const { wallet } = req.body;

  if (!wallet) {
    return res.status(400).json({ error: 'Wallet is required.' });
  }

  try {
    const result = await Report.updateMany(
      { wallet },
      { $set: { status: 'escalated', source: 'admin' } }
    );

    res.json({
      message: 'Escalation recorded.',
      modified: result.modifiedCount,
    });
  } catch (err) {
    console.error('❌ Escalation error:', err);
    res.status(500).json({ error: 'Failed to escalate.' });
  }
});

// List all files in the /dumps directory (Admin only)
router.get('/files', auth, adminOnly, logAccess('admin_files_list'), (req, res) => {
  fs.readdir(dumpsDir, (err, files) => {
    if (err) {
      console.error('❌ Failed to read dumps directory:', err);
      return res.status(500).json({ error: 'Failed to list files' });
    }

    res.json({ files });
  });
});

// Download a specific dump file (Admin only)
router.get('/download/:filename', auth, adminOnly, logAccess('admin_file_download'), (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(dumpsDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.download(filePath, filename, (err) => {
    if (err) {
      console.error('❌ Error downloading file:', err);
      res.status(500).json({ error: 'Failed to download file' });
    }
  });
});

module.exports = router;
