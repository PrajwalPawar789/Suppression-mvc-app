// index.js
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session'); // Add this line
const fileRoutes = require('./routes/fileRoutes');
const path = require('path');
const cors = require('cors'); // Import CORS middleware

const app = express();


app.use(cors({
  origin: 'http://localhost:3001'
}));

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'your_secret_key', // Use a random string for the secret
  resave: false,
  saveUninitialized: true
}));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', fileRoutes);

const port = 3000;
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
