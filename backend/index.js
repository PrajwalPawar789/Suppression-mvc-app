const express = require('express');
const cors = require('cors'); // To handle CORS issues
const reportController = require('./controllers/reportController');

const app = express();
const port = process.env.PORT || 3032;

// Middleware
app.use(cors()); // Allow requests from your React app
app.use(express.json());

// Routes
app.get('/report', reportController.getReportData);
app.get('/report/lead-data', reportController.getLeadDataForDay );
app.get('/qqreport', reportController.getQQReportData);
app.get('/report/qqlead-data', reportController.getQQLeadDataForDay );

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
