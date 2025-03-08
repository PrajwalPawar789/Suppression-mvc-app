const express = require('express');
const router = express.Router();
const multer = require('multer');
const AllSuppressionController = require('../controllers/AllSuppressionController');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/') // Make sure this directory exists
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ storage: storage });

// Routes
router.get('/all-suppression-check', AllSuppressionController.renderSuppressionCheck);
router.post('/all-suppression-check', upload.single('file'), AllSuppressionController.processSuppressionCheck);

module.exports = router; 