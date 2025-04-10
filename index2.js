const express = require('express');
const session = require('express-session');
const fileRoutes = require('./routes/fileRoutes');
const path = require('path');
const cors = require('cors');
const https = require('https');
const http = require('http');
const fs = require('fs');

const app = express();

// Allowed origins for CORS
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

app.use(cors({
  origin: function (origin, callback) {
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

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// View engine and body parsing
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));

// Routes
app.use('/', fileRoutes);

// SSL Certificate paths
const sslOptions = {
  key: fs.readFileSync('/root/manlitics.in/privkey.pem'),
  cert: fs.readFileSync('/root/manlitics.in/fullchain1.pem'),
};

// HTTPS server on port 443
const httpsPort = 444;
https.createServer(sslOptions, app).listen(httpsPort, () => {
  console.log(`✅ Secure server running at https://localhost:${httpsPort}`);
});

// Optional: HTTP server redirecting to HTTPS
const httpPort = 3000;
http.createServer((req, res) => {
  res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
  res.end();
}).listen(httpPort, () => {
  console.log(`🚀 HTTP server running on port ${httpPort}, redirecting to HTTPS`);
});
