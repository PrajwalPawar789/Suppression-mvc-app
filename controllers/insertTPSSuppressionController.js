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

async function insertTPSSuppression(req, res) {
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
            A: 'phone_number',
            B: 'campaign_id',
            C: 'qa_name'
        }
    });

    fs.unlinkSync(filePath); // Clean up the file after processing

    const msftDomain = result.Sheet1.map(row => ({
        phone_number: row.phone_number,
        campaign_id: row.campaign_id,
        qa_name: row.qa_name
    }));

    const client = await pool.connect();
    try {
        for (const suppression of msftDomain) {
            const insertQuery = 'INSERT INTO public.phone_campaigns (phone_number,campaign_id,qa_name) VALUES ($1, $2, $3)';
            await client.query(insertQuery, [
                suppression.phone_number,
                suppression.campaign_id,
                suppression.qa_name
            ]);
            logger.info(`${req.session.username} Inserted TPS Phone Suppression: ${suppression.phone_number}-${suppression.campaign_id}-${suppression.qa_name}`);
        }
        res.send('TPS Phone records inserted successfully.');
    } catch (error) {
        logger.error(`${req.session.username} Error inserting TPS Phone suppressions: ${error}`);
        res.status(500).send('Failed to insert TPS Phone suppression records.');
    } finally {
        client.release();
        logger.info(`${req.session.username} Database connection released.`);
    }
}


module.exports = {
    insertTPSSuppression
};