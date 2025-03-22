const express = require('express');
const fileController = require('../controllers/fileController');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('Received date from form:', req.body.dateFilter);
    const result = await fileController.uploadFile(req, res);
    res.json(result);
  } catch (error) {
    console.error('Error in upload route:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 