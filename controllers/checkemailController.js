const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'suppression-db',
    password: 'root',
    port: 5432
});

async function checkEmail(req, res) {
    const { email, clientCode } = req.body;
    console.log("Checking email:", email, "for client code:", clientCode);
    const client = await pool.connect();
    try {
        const query = 'SELECT * FROM campaigns WHERE email = $1 AND client = $2';
        const result = await client.query(query, [email, clientCode]);
        if (result.rows.length > 0) {
            console.log("Email exists in the database for the specified client code.");
            res.send('Email exists in the database for the specified client code.');
        } else {
            console.log("Email does not exist in the database for the specified client code.");
            res.send('Email does not exist in the database for the specified client code.');
        }
    } catch (err) {
        console.error("Error checking email:", err);
        res.status(500).send("Failed to check email.");
    } finally {
        client.release();
    }
}

module.exports = {
    checkEmail
};
