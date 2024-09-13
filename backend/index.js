const express = require('express');
const cors = require('cors'); // To handle CORS issues
const reportController = require('./controllers/reportController');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allow requests from your React app
app.use(express.json());

// Routes
app.get('/report', reportController.getReportData);

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
