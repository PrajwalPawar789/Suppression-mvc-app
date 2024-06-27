// routes/fileRoutes.js
const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const suppressionDataController = require('../controllers/suppressionDataController');
const checkemailController = require('../controllers/checkemailController');
const loginController = require('../controllers/loginController'); // Add this line

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.isAuthenticated) {
    next();
  } else {
    res.redirect('/login');
  }
};

router.get('/', isAuthenticated, (req, res) => {
  console.log(req.session.username);
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
    'ankita.tope'
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

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to logout' });
      }
      res.redirect('/login');
    });
  });

router.post('/insert', isAuthenticated, suppressionDataController.insertSuppressionData);
router.post('/upload', isAuthenticated, fileController.upload.single('excelFile'), fileController.uploadFile);
router.post('/process', isAuthenticated, fileController.upload.single('excelFile'), suppressionDataController.processExcel);

router.post('/checkemail', isAuthenticated, checkemailController.checkEmail);
router.post('/login', loginController.login); // Define the new route for login

module.exports = router;
