const fs = require('fs');
const { Pool } = require('pg');
const ExcelJS = require('exceljs');
const logger = require('./logger'); // Ensure you have a logger module

// PostgreSQL connection settings
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: 'supppression-db',
  password: "root",
  port: 5432,
});

// Helper function to normalize strings
const normalizeString = (str) => {
  if (str === undefined || str === null) {
    return "";
  }
  if (typeof str !== "string") {
    return "";
  }
  return str.trim();
};

// Function to check the database for a match based on email, left3, and left4
async function checkDatabase(email, left3, left4, username) {
  logger.info(`${username} - Checking database for email: ${email}, left3: ${left3}, left4: ${left4}`);
  const client = await pool.connect();
  try {
    const query = `
      SELECT 
        CASE WHEN EXISTS (SELECT 1 FROM public.deadcontact WHERE emailid = $1) THEN 'Email Match' ELSE 'Email Unmatch' END AS email_status,
        CASE WHEN EXISTS (SELECT 1 FROM public.deadcontact WHERE left3 = $2) THEN 'Left3 Match' ELSE 'Left3 Unmatch' END AS left3_status,
        CASE WHEN EXISTS (SELECT 1 FROM public.deadcontact WHERE left4 = $3) THEN 'Left4 Match' ELSE 'Left4 Unmatch' END AS left4_status
    `;
    const result = await client.query(query, [email, left3, left4]);
    const row = result.rows[0];
    return {
      emailStatus: row.email_status,
      left3Status: row.left3_status,
      left4Status: row.left4_status,
    };
  } catch (error) {
    logger.error(`${username} - Database query error for email ${email}: ${error.message}`);
    return { emailStatus: 'Error', left3Status: 'Error', left4Status: 'Error' };
  } finally {
    client.release();
    logger.info(`${username} - Database connection released after checking email: ${email}`);
  }
}

// Helper function to generate left3 and left4 values
const generateLeftValues = (firstName, lastName, companyName) => {
  const left3 = `${firstName.slice(0, 3)}${lastName.slice(0, 3)}${companyName.slice(0, 3)}`;
  const left4 = `${firstName.slice(0, 4)}${lastName.slice(0, 4)}${companyName.slice(0, 4)}`;
  return { left3, left4 };
};

// Function to process the uploaded file
async function processFile(filePath, username) {
  logger.info(`${username} - Processing file: ${filePath}`);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);

  // Check if the required column names are present
  const firstNameIndex = worksheet.getRow(1).values.indexOf('First Name');
  const lastNameIndex = worksheet.getRow(1).values.indexOf('Last Name');
  const companyNameIndex = worksheet.getRow(1).values.indexOf('Company Name');
  const emailIndex = worksheet.getRow(1).values.indexOf('Email ID');

  if (firstNameIndex === -1 || lastNameIndex === -1 || companyNameIndex === -1 || emailIndex === -1) {
    logger.error(`${username} - Missing required columns`);
    return { error: 'Missing required columns' };
  }

  // Set headers for new status columns
  const statusColumnIndex = worksheet.columnCount + 1;
  worksheet.getRow(1).getCell(statusColumnIndex).value = 'Email Match Status';
  worksheet.getRow(1).getCell(statusColumnIndex + 1).value = 'Left3 Match Status';
  worksheet.getRow(1).getCell(statusColumnIndex + 2).value = 'Left4 Match Status';

  for (let i = 2; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    const firstName = normalizeString(row.getCell(firstNameIndex).value);
    const lastName = normalizeString(row.getCell(lastNameIndex).value);
    const companyName = normalizeString(row.getCell(companyNameIndex).value);
    const email = normalizeString(row.getCell(emailIndex).value);
    
    // Generate left3 and left4
    const { left3, left4 } = generateLeftValues(firstName, lastName, companyName);

    const { emailStatus, left3Status, left4Status } = await checkDatabase(email, left3, left4, username);

    // Write results to the new columns in the same row
    row.getCell(statusColumnIndex).value = emailStatus;
    row.getCell(statusColumnIndex + 1).value = left3Status;
    row.getCell(statusColumnIndex + 2).value = left4Status;

    row.commit(); // Ensure the row is committed after writing values
    logger.info(`${username} - Processed row ${i} with email ${email} - Email Status: ${emailStatus}, Left3 Status: ${left3Status}, Left4 Status: ${left4Status}`);
  }

  const newFilePath = `Updated-${Date.now()}.xlsx`;
  await workbook.xlsx.writeFile(newFilePath);
  logger.info(`${username} - File processed successfully. New file created: ${newFilePath}`);
  return newFilePath;
}

const uploadFile = async (req, res) => {
  const username = req.session.username || 'Anonymous'; // Fallback if username is not set
  if (!req.file) {
    logger.warn(`${username} - No file uploaded.`);
    return res.status(400).send("No file uploaded.");
  }

  const filePath = req.file.path;
  try {
    const result = await processFile(filePath, username);
    if (result.error) {
      logger.error(`${username} - File processing error: ${result.error}`);
      return res.status(400).send(result.error);
    }
    logger.info(`${username} - File download initiated: ${result}`);
    res.download(result);
  } catch (error) {
    logger.error(`${username} - Error while processing file: ${error.message}`);
    res.status(500).send("An error occurred while processing the file.");
  } finally {
    fs.unlinkSync(filePath);
    logger.info(`${username} - Temporary file deleted: ${filePath}`);
  }
};

module.exports = {
  uploadFile,
  processFile,
  checkDatabase,
  // Other exports as needed...
};