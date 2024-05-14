const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const suppressionDataController = require('../controllers/suppressionDataController');

router.get('/', (req, res) => {
  res.render('upload');
});

router.get('/insert', (req, res) => {
  res.render('insertsuppressiondata'); // Render the page to upload and check suppression data
});

router.post('/insert', suppressionDataController.insertSuppressionData); // Inserts data into DB
router.post('/upload', fileController.upload.single('excelFile'), fileController.uploadFile); // Regular file upload
router.post('/process', fileController.upload.single('excelFile'), suppressionDataController.processExcel); // Process uploaded Excel file for checking suppression data

module.exports = router;
