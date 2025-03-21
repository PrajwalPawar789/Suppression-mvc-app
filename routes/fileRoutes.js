// routes/fileRoutes.js
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const quality_qualifiedController = require('../controllers/quality-qualifiedController');
const suppressionDataController = require('../controllers/suppressionDataController');
const checkemailController = require('../controllers/checkemailController');
const loginController = require('../controllers/loginController'); // Add this line
const invalidemailController = require('../controllers/invalidemail');
const globalemailsuppression = require('../controllers/globalemailsuppression');
const msft_client_suppression = require('../controllers/msft_client_suppression');
const msft_domain_suppression = require('../controllers/msft_domain_suppression');
const dncsuppression = require('../controllers/dncsuppression');
const invalidemail = require('../controllers/invalidemail');
const reportController = require('../controllers/reportController');
const invalidemailController1 = require('../controllers/invalidemailController');
const globalemailController = require('../controllers/globalemailController');
const dncCompanyController = require('../controllers/dnc_companyController');
const dncSuppressionController = require('../controllers/dnc_suppressionController');
// const qualityqualifiedController = require('../controllers/quality-qualifiedController');
const TPCCTPSSupressionController = require('../controllers/TPCCTPSSupressionController');
const DeadContactController = require('../controllers/DeadContactController');
const TE16_MSFT_Accept_all_domain_suppression = require('../controllers/TE16_MSFT_Accept_all_domain_suppression');
const linkedinLinkController = require('../controllers/linkedinLinkController'); // Import the controller
const AllSuppressionController = require('../controllers/AllsuppressionController');
const allSuppressionController = require('../controllers/AllsuppressionController');
const path = require('path');
const fs = require('fs');

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

router.get('/quality-qualified', isAuthenticated, (req, res) => {
  // console.log(req.session.username);
  res.render('quality-qualified');
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
  	'aryansingh.thakur',
  	'Gauri.Chauhan',
  	'Mohit.Ranparia',
  	'Gajanan.Jadhav',
  	'Prashant.Jagtap',
  	'Amruta.Gosavi',
  	'Rohit.Adake',
  	'Jakir.Shaikh',
  	'Hujaifa.Patil',
  	'AVES.MULLA',
  	'MUSKAN.DESAI',
  	'Somnath.Gore',
  	'Akash.Panchal',
  	'Shivshankar.Chandane',
  	'Akshay.Mowade',
  	'prasad.chavan',
  	'SWAPNIL.MAHSKE'
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

// router.get('/all_suppression_check', (req, res) => {
  
//   res.render('all_suppression_check')
// })

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

  router.get('/TPC&CTPS-Supression', isAuthenticated, (req, res) => {
    // console.log(req.session.username);
    res.render('TPC&CTPSSupression');
  });

  router.get('/TE16_MSFT_Accept_all_domain_suppression', isAuthenticated, (req, res) => {
    // console.log(req.session.username);
    res.render('TE16_MSFT_Accept_all_domain_suppression');
  });
  
  router.get('/DeadContact-Supression', isAuthenticated, (req, res) => {
    // console.log(req.session.username);
    res.render('DeadContact');
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

router.post('/check-database', fileController.checkDatabaseAPI);

// In routes/fileRoutes.js
router.post('/dncsuppressionapi', async (req, res) => {
  const { email, companyName, domain } = req.body;
  const username = req.session.username || 'Anonymous';

  if (!email || !companyName || !domain) {
    return res.status(400).json({ error: 'Missing required fields: email, companyName, domain' });
  }

  try {
    const result = await dncsuppression.checkDatabase(email, companyName, domain, username);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while checking the database.' });
  }
});

// In routes/fileRoutes.js
router.post('/invalidemail', async (req, res) => {
  const { email } = req.body;
  const username = req.session.username || 'Anonymous';

  if (!email) {
    return res.status(400).json({ error: 'Missing required fields: email' });
  }

  try {
    const result = await invalidemail.checkDatabase(email, username);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while checking the database.' });
  }
});

// In routes/fileRoutes.js
router.post('/globalemailsuppression', async (req, res) => {
  const { email } = req.body;
  const username = req.session.username || 'Anonymous';

  if (!email) {
    return res.status(400).json({ error: 'Missing required fields: email' });
  }

  try {
    const result = await globalemailsuppression.checkDatabase(email, username);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while checking the database.' });
  }
});

router.post('/msft_client_suppression', async (req, res) => {
  const { email } = req.body;
  const username = req.session.username || 'Anonymous';

  if (!email) {
    return res.status(400).json({ error: 'Missing required fields: email' });
  }

  try {
    const result = await msft_client_suppression.checkDatabase(email, username);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while checking the database.' });
  }
});

router.post('/msft_domain_suppression', async (req, res) => {
  const { domain } = req.body;
  const username = req.session.username || 'Anonymous';

  if (!domain) {
    return res.status(400).json({ error: 'Missing required fields: domain' });
  }

  try {
    const result = await msft_domain_suppression.checkDatabase(domain, username);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while checking the database.' });
  }
});

router.post('/master-msft', fileController.processSingleEntry); 

router.post('/qq-msft', quality_qualifiedController.processSingleEntry);

// Express router setup
router.post('/master-all-client', async (req, res) => {
  console.log("Request received:", req.body);
  const result = await fileController.processSingleAllClient(req.body); // Note the 'fileController.' prefix
  if (result.error) {
    return res.status(400).send(result.error);
  }
  res.status(200).send(result);
});

router.post('/master-suppression', fileController.checkDatabaseAPI);

router.post('/qq-suppression', quality_qualifiedController.checkDatabaseAPI);

// In routes/fileRoutes.js
router.post('/TE16-MSFT-Accept-all-domain-suppression', async (req, res) => {
  // Make sure the user is authenticated before processing the request
  try {
    await TE16_MSFT_Accept_all_domain_suppression.checkSingleDomainAPI(req, res);  // Call the controller method
  } catch (error) {
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

// In routes/fileRoutes.js
router.post('/TPC&CTPSSupression', async (req, res) => {
  // Ensure the user is authenticated before processing the request
  try {
    await TPCCTPSSupressionController.checkSinglePhoneNumberAPI(req, res);  // Call the controller method to check phone number
  } catch (error) {
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

// Add the new route for LinkedIn link query
router.post('/linkedin-link', async (req, res) => {
  try {
      await linkedinLinkController.linkedinLinkApi(req, res); // Call the controller method
  } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
  }
});


router.post('/master-suppression', fileController.checkDatabaseAPI);

router.post('/insert', isAuthenticated, suppressionDataController.insertSuppressionData);
router.post('/upload', isAuthenticated, fileController.upload.single('excelFile'), fileController.uploadFile);
// router.post('/quality-qualified', isAuthenticated, qualityqualifiedController.upload.single('excelFile'), qualityqualifiedController.uploadFile);

router.post('/process', isAuthenticated, fileController.upload.single('excelFile'), suppressionDataController.processExcel);
router.post('/invalidemailController1', isAuthenticated, upload.single('file'), invalidemailController1.insertInvalidEmailData);

router.post('/checkemail', isAuthenticated, checkemailController.checkEmail);
router.post('/login', loginController.login); // Define the new route for login
router.post('/invalidemailprocess', isAuthenticated, upload.single('file'), invalidemailController.uploadFile);
router.post('/TPC&CTPSSupression', isAuthenticated, upload.single('file'), TPCCTPSSupressionController.uploadFile);
router.post('/TE16_MSFT_Accept_all_domain_suppression', isAuthenticated, upload.single('file'), TE16_MSFT_Accept_all_domain_suppression.uploadFile);

router.post('/DeadContactController', isAuthenticated, upload.single('file'), DeadContactController.uploadFile);

router.post('/globalemailprocess', isAuthenticated, upload.single('file'), globalemailController.insertGlobalEmailData);
router.post('/dnccompany', isAuthenticated, upload.single('dncFile'), dncCompanyController.insertDncCompanyData);
router.post('/dnc-suppression', isAuthenticated, upload.single('dncSuppressionFile'), dncSuppressionController.insertDncSuppressionData);

router.post('/globalemailsuppression', isAuthenticated, upload.single('file'), globalemailsuppression.uploadFile);
router.post('/dncsuppression', isAuthenticated, upload.single('file'), dncsuppression.uploadFile);

// Replace with single route definitions
router.get('/all_suppression_check', isAuthenticated, (req, res) => {
    res.render('all_suppression_check');
});

router.post('/all-suppression-check',isAuthenticated, upload.single('file'), allSuppressionController.processAllSuppression);

// Add this route before module.exports
router.get('/download/:filename', (req, res) => {
    const filename = path.basename(req.params.filename);
    const filepath = path.join(__dirname, '../uploads', filename);
    
    res.download(filepath, 'suppression_results.xlsx', (err) => {
        if (err) {
            console.error('Error downloading file:', err);
            res.status(500).send('Error downloading file');
        }
        // Clean up: delete the file after sending
        fs.unlink(filepath, (unlinkErr) => {
            if (unlinkErr) console.error('Error deleting temp file:', unlinkErr);
        });
    });
});

module.exports = router;