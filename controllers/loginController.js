// controllers/loginController.js
const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'supppression-db',
  password: 'root',
  port: 5432
});

const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
    if (result.rows.length > 0) {
      req.session.isAuthenticated = true; // Set isAuthenticated flag in session
      res.redirect('/');
    } else {
      req.session.isAuthenticated = false;
      res.send('Invalid username or password');
    }
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = { login };
