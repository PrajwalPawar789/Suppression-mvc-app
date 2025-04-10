const express = require('express');
const session = require('express-session');
const fileRoutes = require('./routes/fileRoutes');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
const http = require('http');

const app = express();

// ✅ Allowed Origins
const allowedOrigins = [
  'https://crm.manlitics.in/',
  'https://suppression.manlitics.in:3050',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:5500',
  'http://192.168.1.36:3000',
  'http://192.168.1.47',
  'http://192.168.0.16',
  'https://crm.techresearchinfo.com',
  'https://www.techresearchinfo.com',
  'http://suppression.manlitics.in:3000',
  'https://suppression.manlitics.in:3000'
];

// ✅ CORS Configuration
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// ✅ Middleware to redirect HTTP to HTTPS only for suppression.manlitics.in
const redirectToHTTPS = (req, res, next) => {
  const host = req.hostname;
  if (req.protocol === 'http' && host === 'suppression.manlitics.in') {
    return res.redirect(`https://${host}:3000${req.url}`);
  }
  next();
};

app.use(redirectToHTTPS);

// ✅ Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));

// ✅ Static Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// ✅ EJS Setup
app.set('view engine', 'ejs');

// ✅ Routes
app.use('/', fileRoutes);

// ✅ SSL Certs
const sslOptions = {
  key: fs.readFileSync('/root/manlitics.in/privkey.pem'),
  cert: fs.readFileSync('/root/manlitics.in/fullchain1.pem')
};

// Start HTTPS server on 3000 (for public access via domain)
https.createServer(sslOptions, app).listen(3050, () => {
  console.log("✅ HTTPS Server running at https://suppression.manlitics.in:3000");
});

// Optional: Start HTTP server on another internal IP (for local access)
// WARNING: This will conflict if you try to bind both to the same port on all interfaces.
// So only use this if you're testing on localhost:
http.createServer(app).listen(3000, '192.168.1.36', () => {
  console.log("✅ HTTP Server running at http://192.168.1.36:3000");
});
