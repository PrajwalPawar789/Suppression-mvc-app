const express = require('express');
const session = require('express-session');
const fileRoutes = require('./routes/fileRoutes');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
const http = require('http'); // For HTTP server to handle redirection

const app = express();

// Allowed Origins for CORS
const allowedOrigins = [
  'http://localhost',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://192.168.1.47',
  'http://192.168.0.16',
  'http://192.168.1.36:3000',
  'https://crm.techresearchinfo.com',
  'http://127.0.0.1:5500',
  'https://www.techresearchinfo.com'
];

// CORS setup
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false
}));

// Redirect HTTP to HTTPS
const redirectToHTTPS = (req, res, next) => {
  if (req.protocol === 'http') {
    return res.redirect(301, `https://manlitics.in:3000${req.url}`);
  }
  next();
};

// Use the redirect middleware
app.use(redirectToHTTPS);

// Serve static files from the "uploads" directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session setup
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));

// Serve static assets
app.use(express.static(path.join(__dirname, 'public')));

// Use file routes
app.use('/', fileRoutes);

// Load SSL certificate files for HTTPS
const sslOptions = {
  key: fs.readFileSync('/root/manlitics.in/privkey.pem'),
  cert: fs.readFileSync('/root/manlitics.in/fullchain1.pem')
};

// Create HTTPS server (runs on port 3000)
const httpsPort = 3000;
https.createServer(sslOptions, app).listen(httpsPort, () => {
  console.log(`🚀 HTTPS Server running securely at https://manlitics.in:3000`);
});

// Create HTTP server (runs on port 80) to handle redirection
const httpPort = 83;
http.createServer(app).listen(httpPort, () => {
  console.log(`🚀 HTTP Server running and redirecting to HTTPS on port ${httpPort}`);
});
