// controllers/dnc_suppressionController.js
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

async function insertMsftAcceptAllDomainSuppression(req, res) {
    console.log("Logging Request", req.session.username);
    if (!req.file) {
        return res.status(400).send('File is required.');
    }

    // Process the uploaded file
    const filePath = path.join(__dirname, '../uploads/', req.file.filename);
    const result = excelToJson({
        sourceFile: filePath,
        header: { rows: 1 },
        columnToKey: {
            A: 'domain_name',
            B: 'status'
        }
    });

    fs.unlinkSync(filePath); // Clean up the file after processing

    const msftAceeptAll = result.Sheet1.map(row => ({
        domain_name: row.domain_name,
        status: row.status
    }));

    const client = await pool.connect();
    try {
        for (const suppression of msftAceeptAll) {
            const insertQuery = 'INSERT INTO public.te16_msft_accept_all_domain_suppression (domain_name,status) VALUES ($1, $2)';
            await client.query(insertQuery, [
                suppression.domain_name,
                suppression.status
            ]);
            logger.info(`${req.session.username} Inserted TE16 MSFT Accept All Domain Suppression: ${suppression.domain_name}-${suppression.status}`);
        }
        res.send('TE16 MSFT Accept All Domain records inserted successfully.');
    } catch (error) {
        logger.error(`${req.session.username} Error inserting TE16 MSFT Accept All Domain suppressions: ${error}`);
        res.status(500).send('Failed to insert TE16 MSFT Accept All Domain suppression records.');
    } finally {
        client.release();
        logger.info(`${req.session.username} Database connection released.`);
    }
}

module.exports = {
    insertMsftAcceptAllDomainSuppression
};