// routes/fileRoutes.js
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const suppressionDataController = require('../controllers/suppressionDataController');
const checkemailController = require('../controllers/checkemailController');
const loginController = require('../controllers/loginController'); // Add this line
const invalidemailController = require('../controllers/invalidemail');
const globalemailsuppression = require('../controllers/globalemailsuppression');
const dncsuppression = require('../controllers/dncsuppression');
const reportController = require('../controllers/reportController');
const invalidemailController1 = require('../controllers/invalidemailController');
const globalemailController = require('../controllers/globalemailController');
const dncCompanyController = require('../controllers/dnc_companyController');
const dncSuppressionController = require('../controllers/dnc_suppressionController');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.isAuthenticated) {
    next();
  } else {
    res.redirect('/login');
  }
};

router.get('/', isAuthenticated, (req, res) => {
  // console.log(req.session.username);
  res.render('upload');
});

router.get('/insert', (req, res, next) => {
  const allowedUsernames = [
    'prajwal',
    'sagar.gandhi',
    'saurabh.bhongade',
    'akash.waghmare',
    'monika.salunkhe',
    'shivraj.shinde',
    'shailesh.gayakwad',
    'sumit.mahajan',
    'sudhir.jagtap',
    'sandesh.chougule',
    'khandu.shinde',
    'sudarshan.bairagi',
    'shubham.ingale',
    'aniket.hawale',
    'rakesh.late',
    'sahil.murkute',
    'kumar.desai',
    'om.khene',
    'ankita.tope',
  	'Tejas.Bhausaheb',
  	'Rushikesh.Patil',
  	'Nikita.Tumsare',
  	'Roshan.Lakade',
  	'Akash.Yadav',
  	'aryansingh.thakur'
  ];
  
  if (req.session.isAuthenticated && allowedUsernames.includes(req.session.username)) {
    res.render('insertsuppressiondata');
  } else {
    res.redirect('/login');
  }
});


router.get('/checkemail', isAuthenticated, (req, res) => {
  // console.log(req.session.username);
  res.render('checkemail');
});



router.get('/login', (req, res) => {
  
  res.render('login');
});

router.get('/documentation', isAuthenticated, (req, res) => { // Add this route
  res.render('documentation');
});

// Add route to render the dashboard page
router.get('/dashboard', isAuthenticated, (req, res) => {
  res.render('dashboard'); // Render the dashboard.ejs page
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to logout' });
      }
      res.redirect('/login');
    });
  });

  router.get('/invalidemailcheck', isAuthenticated, (req, res) => {
    // console.log(req.session.username);
    res.render('invalidemailcheck');
  });

  router.get('/globalemailsuppression', isAuthenticated, (req, res) => {
    // console.log(req.session.username);
    res.render('globalemailsuppression');
  });

  router.get('/dncsuppression', isAuthenticated, (req, res) => {
    // console.log(req.session.username);
    res.render('dncsuppression');
  });

  router.get('/report', isAuthenticated, reportController.getReportData);


router.post('/insert', isAuthenticated, suppressionDataController.insertSuppressionData);
router.post('/upload', isAuthenticated, fileController.upload.single('excelFile'), fileController.uploadFile);
router.post('/process', isAuthenticated, fileController.upload.single('excelFile'), suppressionDataController.processExcel);
router.post('/invalidemailController1', isAuthenticated, upload.single('file'), invalidemailController1.insertInvalidEmailData);

router.post('/checkemail', isAuthenticated, checkemailController.checkEmail);
router.post('/login', loginController.login); // Define the new route for login
router.post('/invalidemailprocess', isAuthenticated, upload.single('file'), invalidemailController.uploadFile);
router.post('/globalemailprocess', isAuthenticated, upload.single('file'), globalemailController.insertGlobalEmailData);
router.post('/dnccompany', isAuthenticated, upload.single('dncFile'), dncCompanyController.insertDncCompanyData);
router.post('/dnc-suppression', isAuthenticated, upload.single('dncSuppressionFile'), dncSuppressionController.insertDncSuppressionData);

router.post('/globalemailsuppression', isAuthenticated, upload.single('file'), globalemailsuppression.uploadFile);
router.post('/dncsuppression', isAuthenticated, upload.single('file'), dncsuppression.uploadFile);

module.exports = router;