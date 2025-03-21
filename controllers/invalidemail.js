const fs = require('fs');
const { Pool } = require('pg');
const ExcelJS = require('exceljs');
const logger = require('./logger'); // Ensure you have a logger module

// PostgreSQL connection settings
const pool = new Pool({
  user: "root",
  host: "192.168.1.36",
  database: "suppression",
  password: "Scitilnam$007",
  port: 5432,
});

// Helper function to normalize strings
const normalizeString = (str) => {
  if (str === undefined || str === null) {
    return "";
  }
  return typeof str === "string" ? str.trim() : "";
};

// Function to check the database for a match based on email
async function checkDatabase(email, username) {
  logger.info(`${username} - Checking database for email: ${email}`);
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM public.invalid_email_addresses WHERE email_address = $1
          ) THEN 'Email Match'
          ELSE 'Email Unmatch'
        END AS email_status
    `;
    
    const result = await client.query(query, [email]);
    const row = result.rows[0] || { email_status: 'Unmatch' };
    
    return {
      emailStatus: row.email_status,
    };
  } catch (error) {
    logger.error(`${username} - Database query error: ${error.message}`);
    return { emailStatus: 'Error' };
  } finally {
    client.release();
    logger.info(`${username} - Database connection released`);
  }
}

// Function to process the uploaded file
async function processFile(filePath, username) {
  logger.info(`${username} - Processing file: ${filePath}`);
  
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);

  // Handle missing columns gracefully
  let emailIndex = worksheet.getRow(1).values.indexOf('Email ID');

  if (emailIndex === -1) {
    logger.warn(`${username} - Missing 'Email ID' column. Trying 'Email' instead.`);
    emailIndex = worksheet.getRow(1).values.indexOf('Email');
  }

  if (emailIndex === -1) {
    logger.error(`${username} - Missing required columns`);
    return { error: 'Missing required columns' };
  }

  // Add "Email Match Status" column
  worksheet.getRow(1).getCell(worksheet.columnCount + 1).value = 'Email Match Status';

  for (let i = 2; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    const email = normalizeString(row.getCell(emailIndex).value);

    if (email) {
      const { emailStatus } = await checkDatabase(email, username);
      row.getCell(worksheet.columnCount + 1).value = emailStatus;
      logger.info(`${username} - Processed row ${i} with email ${email} - Email Status: ${emailStatus}`);
    } else {
      row.getCell(worksheet.columnCount + 1).value = 'Invalid Email';
    }
    
    row.commit();
  }

  const newFilePath = `Updated-${Date.now()}.xlsx`;
  await workbook.xlsx.writeFile(newFilePath);
  logger.info(`${username} - File processed successfully. New file created: ${newFilePath}`);
  return newFilePath;
}

// Upload file handler
const uploadFile = async (req, res) => {
  const username = req.session?.username || 'Anonymous'; 

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

// Export the functions
module.exports = {
  uploadFile,
  processFile,
  checkDatabase,
};
