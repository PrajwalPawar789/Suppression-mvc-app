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

async function insertMsftDomainSuppression(req, res) {
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
            A: 'domain'
        }
    });

    fs.unlinkSync(filePath); // Clean up the file after processing

    const msftDomain = result.Sheet1.map(row => ({
        domain: row.domain
    }));

    const client = await pool.connect();
    try {
        for (const suppression of msftDomain) {
            const insertQuery = 'INSERT INTO public.microsoft_domain_suppression (domain) VALUES ($1)';
            await client.query(insertQuery, [
                suppression.domain
            ]);
            logger.info(`${req.session.username} Inserted MSFT Domain Suppression: ${suppression.domain}`);
        }
        res.send('MSFT Domain records inserted successfully.');
    } catch (error) {
        logger.error(`${req.session.username} Error inserting MSFT Domain suppressions: ${error}`);
        res.status(500).send('Failed to insert MSFT Domain suppression records.');
    } finally {
        client.release();
        logger.info(`${req.session.username} Database connection released.`);
    }
}

async function insertMsftClientSuppression(req, res) {
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
            A: 'email'
        }
    });

    fs.unlinkSync(filePath); // Clean up the file after processing

    const msftClient = result.Sheet1.map(row => ({
        email: row.email
    }));

    const client = await pool.connect();
    try {
        for (const suppression of msftClient) {
            const insertQuery = 'INSERT INTO public.microsoft_client_suppression (email) VALUES ($1)';
            await client.query(insertQuery, [
                suppression.email
            ]);
            logger.info(`${req.session.username} Inserted MSFT Client Suppression: ${suppression.email}`);
        }
        res.send('MSFT Client records inserted successfully.');
    } catch (error) {
        logger.error(`${req.session.username} Error inserting MSFT Client suppressions: ${error}`);
        res.status(500).send('Failed to insert MSFT Client suppression records.');
    } finally {
        client.release();
        logger.info(`${req.session.username} Database connection released.`);
    }
}

module.exports = {
    insertMsftDomainSuppression,
    insertMsftClientSuppression
};