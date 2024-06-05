const multer = require('multer');
const fs = require('fs');
const { Pool } = require('pg');
const ExcelJS = require('exceljs');

// PostgreSQL connection settings
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'supppression-db',
  password: 'root',
  port: 5432
});

// Helper function to normalize strings
const normalizeString = (str) => {
  if (str === undefined || str === null) {
    // console.log('Attempting to normalize an undefined or null value.');
    return '';
  }
  if (typeof str !== 'string') {
    // console.log('Attempting to normalize a non-string value:', str);
    return '';
  }
  return str.trim();
};

// Multer configuration for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

// Function to check the database for a match based on left_3 and left_4
async function checkDatabase(left3, left4, clientCode, dateFilter) {
  const client = await pool.connect();
  try {
    const query = `
      SELECT date_, EXISTS (
        SELECT 1
        FROM campaigns
        WHERE 
          left_3 = $1 AND
          left_4 = $2 AND
          client = $3
      ) AS match_found
      FROM campaigns
      WHERE 
          left_3 = $1 AND
          left_4 = $2 AND
          client = $3
      LIMIT 1;`;
    const result = await client.query(query, [left3, left4, clientCode]);
    const row = result.rows[0];
    if (row) {
      const dateFromDb = new Date(row.date_);
      if (isNaN(dateFromDb.getTime())) {
        // console.error('Invalid date format:', row.date_);
        return { exists: false, dateStatus: 'Invalid Date Format' };
      }

      const currentDate = new Date();
      const monthsAgoDate = new Date();
      monthsAgoDate.setMonth(currentDate.getMonth() - dateFilter); // Correctly sets the months ago date

      return {
        exists: row.match_found,
        dateStatus: dateFromDb < monthsAgoDate ? 'Suppression Cleared' : 'Still Suppressed',
        date: dateFromDb // Return the date for age difference calculation
      };
    }
    return { exists: false, dateStatus: 'Fresh Lead GTG' }; // No record matched
  } catch (error) {
    console.error('Database query error:', error);
    return { exists: false, dateStatus: 'Error' };
  } finally {
    client.release();
  }
}

async function processFile(filePath, clientCode, dateFilter) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);

  // Check if all required column names are present
  const requiredColumns = ['Company Name', 'First Name', 'Last Name', 'Email ID', 'Phone Number'];
  const missingColumns = requiredColumns.filter(colName => !worksheet.getRow(1).values.includes(colName));
  if (missingColumns.length > 0) {
    return { error: `Missing columns: ${missingColumns.join(', ')}` };
  }

  // Proceed with processing the file
  let companyIndex, firstNameIndex, lastNameIndex, emailIndex, phoneIndex;
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    switch (cell.value) {
      case 'Company Name':
        companyIndex = colNumber;
        break;
      case 'First Name':
        firstNameIndex = colNumber;
        break;
      case 'Last Name':
        lastNameIndex = colNumber;
        break;
      case 'Email ID':
        emailIndex = colNumber;
        break;
      case 'Phone Number':
        phoneIndex = colNumber;
        break;
    }
  });

  const statusColumn = worksheet.getColumn(worksheet.columnCount + 1);
  statusColumn.header = 'Match Status';

  const clientCodeStatusColumn = worksheet.getColumn(worksheet.columnCount + 2);
  clientCodeStatusColumn.header = 'Client Code Status';

  const dateStatusColumn = worksheet.getColumn(worksheet.columnCount + 3);
  dateStatusColumn.header = 'Date Status';

  for (let i = 2; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    const firstName = normalizeString(row.getCell(firstNameIndex).value);
    const lastName = normalizeString(row.getCell(lastNameIndex).value);
    const companyName = normalizeString(row.getCell(companyIndex).value);

    const left3 = `${firstName.substring(0, 3)}${lastName.substring(0, 3)}${companyName.substring(0, 3)}`;
    const left4 = `${firstName.substring(0, 4)}${lastName.substring(0, 4)}${companyName.substring(0, 4)}`;

    const dbResult = await checkDatabase(left3, left4, clientCode, dateFilter);

    // console.log(`checking left_3 ${left3} and left_4 ${left4}`);

    // Calculate age difference in days
    const currentDate = new Date();
    const ageDifference = Math.floor((currentDate - dbResult.date) / (1000 * 60 * 60 * 24));
    // console.log(`Age difference in days: ${ageDifference}`);

    row.getCell(statusColumn.number).value = dbResult.exists ? 'Match' : 'Unmatch';
    row.getCell(clientCodeStatusColumn.number).value = dbResult.exists ? 'Match' : 'Unmatch';
    row.getCell(dateStatusColumn.number).value = dbResult.dateStatus;

    row.commit();
  }

  const newFilePath = 'Updated-' + Date.now() + '.xlsx';
  await workbook.xlsx.writeFile(newFilePath);
  return newFilePath;
}

// Read the Excel file, calculate left_3 and left_4, check the database, and add status
async function processFileDynamicQuery(filePath, left3, left4, dateFilter) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);

  // Check if all required column names are present
  const requiredColumns = ['Company Name', 'First Name', 'Last Name', 'Email ID', 'Phone Number'];
  const missingColumns = requiredColumns.filter(colName => !worksheet.getRow(1).values.includes(colName));
  if (missingColumns.length > 0) {
    return { error: `Missing columns: ${missingColumns.join(', ')}` };
  }

  // Proceed with processing the file
  let companyIndex, firstNameIndex, lastNameIndex, emailIndex, phoneIndex;
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    switch (cell.value) {
      case 'Company Name':
        companyIndex = colNumber;
        break;
      case 'First Name':
        firstNameIndex = colNumber;
        break;
      case 'Last Name':
        lastNameIndex = colNumber;
        break;
      case 'Email ID':
        emailIndex = colNumber;
        break;
      case 'Phone Number':
        phoneIndex = colNumber;
        break;
    }
  });

  const statusColumn = worksheet.getColumn(worksheet.columnCount + 1);
  statusColumn.header = 'Match Status';

  const clientCodeStatusColumn = worksheet.getColumn(worksheet.columnCount + 2);
  clientCodeStatusColumn.header = 'Client Code Status';

  const dateStatusColumn = worksheet.getColumn(worksheet.columnCount + 3);
  dateStatusColumn.header = 'Date Status';

  for (let i = 2; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    const firstName = normalizeString(row.getCell(firstNameIndex).value);
    const lastName = normalizeString(row.getCell(lastNameIndex).value);
    const companyName = normalizeString(row.getCell(companyIndex).value);

    const calculatedLeft3 = `${firstName.substring(0, 3)}${lastName.substring(0, 3)}${companyName.substring(0, 3)}`;
    const calculatedLeft4 = `${firstName.substring(0, 4)}${lastName.substring(0, 4)}${companyName.substring(0, 4)}`;

    // console.log(`checking left_3 ${calculatedLeft3} and left_4 ${calculatedLeft4}`);

    // Use dynamic query with parameters
    const dynamicQuery = `
    WITH client_codes AS (
        SELECT unnest(ARRAY['TE16', 'DI31', 'HN36', 'AD62', 'AN12', 'DY78', 'MA99', 'NT26', 'UE88']) AS client_code
    ),
    matches AS (
        SELECT
            cc.client_code,
            EXISTS (
                SELECT 1
                FROM campaigns
                WHERE
                    left_3 = '${calculatedLeft3.replace("'", "''")}' AND
                    left_4 = '${calculatedLeft4.replace("'", "''")}' AND
                    client = cc.client_code
            ) AS match_found,
            (
                SELECT date_::TIMESTAMP
                FROM campaigns
                WHERE
                    left_3 = '${calculatedLeft3.replace("'", "''")}' AND
                    left_4 = '${calculatedLeft4.replace("'", "''")}' AND
                    client = cc.client_code
                LIMIT 1
            ) AS date_
        FROM
            client_codes cc
    ),
    status_summary AS (
        SELECT
            CASE
                WHEN bool_or(m.match_found) THEN
                    CASE
                        WHEN bool_or(m.date_ >= CURRENT_DATE - INTERVAL '${dateFilter} months') THEN 'Still Suppressed'
                        ELSE 'Suppression Cleared'
                    END
                ELSE 'Fresh Lead GTG'
            END AS status
        FROM
            matches m
    )
    SELECT status FROM status_summary;
    `;    

    // Execute the dynamic query
    const dbResult = await pool.query(dynamicQuery);

    // console.log(`Query result: ${dbResult.rows[0].status}`);

    row.getCell(statusColumn.number).value = dbResult.rows[0].status;

    row.commit();
  }

  const newFilePath = 'Updated-' + Date.now() + '.xlsx';
  await workbook.xlsx.writeFile(newFilePath);
  return newFilePath;
}



module.exports = {
  upload,
  processFile,
  processFileDynamicQuery,
  uploadFile: async (req, res) => {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    // Check if the uploaded file is an Excel file
    if (!req.file.originalname.endsWith('.xlsx')) {
      return res.status(400).send('Uploaded file is not an Excel file.');
    }

    const clientCode = req.body.clientCode;
    const dateFilter = parseInt(req.body.dateFilter);

    try {
      if (clientCode === 'All') {
        // Execute the dynamic query
        const result = await processFileDynamicQuery(req.file.path, 'left_3', 'left_4', dateFilter);
        if (result.error) {
          return res.status(400).send(result.error);
        }
        res.download(result, (err) => {
          if (err) throw err;
          fs.unlinkSync(result);
          fs.unlinkSync(req.file.path);
        });
      } else {
        // Execute the normal processFile function
        const result = await processFile(req.file.path, clientCode, dateFilter);
        if (result.error) {
          return res.status(400).send(result.error);
        }
        res.download(result, (err) => {
          if (err) throw err;
          fs.unlinkSync(result);
          fs.unlinkSync(req.file.path);
        });
      }
    } catch (error) {
      console.error('Error processing file:', error);
      res.status(500).send('Error processing the file.');
    }
  }
};
