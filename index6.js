const express = require('express');
const session = require('express-session');
const fileRoutes = require('./routes/fileRoutes');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const https = require('https');

const app = express();

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

// Serve static files from the "uploads" directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/', fileRoutes);

// Load SSL certificate files
const sslOptions = {
  key: fs.readFileSync('/root/manlitics.in/privkey.pem'),
  cert: fs.readFileSync('/root/manlitics.in/cert.pem')
};

// Create HTTPS server
const port = 3000;
https.createServer(sslOptions, app).listen(port, () => {
  console.log(`🚀 Server running securely at https://localhost`);
});
