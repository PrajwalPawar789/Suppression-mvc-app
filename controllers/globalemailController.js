const { Pool } = require('pg');
const logger = require('./logger');
const path = require('path');
const fs = require('fs');
const excelToJson = require('convert-excel-to-json');


// const pool = new Pool({
//     user: "postgres",
//     host: "158.220.121.203",
//     database: "postgres",
//     password: "P0stgr3s%098",
//     port: 5432,
//   });

const pool = new Pool({
    user: "root",
    host: "192.168.1.36",
    database: "suppression",
    password: "Scitilnam$007",
    port: 5432,
  });

async function insertGlobalEmailData(req, res) {

    console.log("loggin Req", req.session.username)
    if (!req.file) {
        return res.status(400).send('File is required.');
    }

    // Process the uploaded file
    const filePath = path.join(__dirname, '../uploads/', req.file.filename);
    const result = excelToJson({
        sourceFile: filePath,
        header: { rows: 1 },
        columnToKey: { A: 'email_address' }
    });

    fs.unlinkSync(filePath); // Clean up the file after processing

    const invalidEmails = result.Sheet1.map(row => row.email_address);

    const client = await pool.connect();
    try {
        for (const email of invalidEmails) {
            
            const insertQuery = `INSERT INTO global_email_suppression (email_address) VALUES ($1);`;
            await client.query(insertQuery, [email]);
            logger.info(` ${req.session.username} Inserted Global email address: ${email}`);
        }
        res.send('Global email addresses inserted successfully.');
    } catch (error) {
        logger.error(` ${req.session.username} Error inserting Global email addresses:`, error);
        res.status(500).send('Failed to insert Global email addresses.');
    } finally {
        client.release();
        logger.info(`${req.session.username} Database connection released.`);
    }
}

module.exports = {
    insertGlobalEmailData
};
