const fs = require('fs');
const { Pool } = require('pg');
const ExcelJS = require('exceljs');

// PostgreSQL connection settings
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "supppression-db",
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

// Function to check the database for a match based on email
async function checkDatabase(email) {
  const client = await pool.connect();
  try {
    const query = `
      SELECT CASE WHEN EXISTS (
        SELECT 1 FROM public.global_email_suppression WHERE email_address = $1
      ) THEN 'Match' ELSE 'Unmatch' END AS match_status;
    `;
    const result = await client.query(query, [email]);
    const row = result.rows[0];
    return row ? row.match_status : 'Unmatch';
  } catch (error) {
    console.error("Database query error:", error);
    return 'Error';
  } finally {
    client.release();
  }
}

// Function to process the uploaded file
async function processFile(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);

  // Check if the required column name "Email ID" is present
  const emailIndex = worksheet.getRow(1).values.indexOf('Email ID');
  if (emailIndex === -1) {
    return { error: 'Missing column: Email ID' };
  }

  // Add the "Match Status" column
  const statusColumn = worksheet.getColumn(worksheet.columnCount + 1);
  statusColumn.header = 'Match Status';

  for (let i = 2; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    const email = normalizeString(row.getCell(emailIndex).value);
    const matchStatus = await checkDatabase(email);
    row.getCell(statusColumn.number).value = matchStatus;
    row.commit();
  }

  const newFilePath = "Updated-" + Date.now() + ".xlsx";
  await workbook.xlsx.writeFile(newFilePath);
  return newFilePath;
}

exports.uploadFile = async (req, res) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }
  
    const filePath = req.file.path;
    try {
      const result = await processFile(filePath);
      if (result.error) {
        return res.status(400).send(result.error);
      }
      res.download(result);
    } catch (error) {
      console.error(error);
      res.status(500).send("An error occurred while processing the file.");
    } finally {
      fs.unlinkSync(filePath);
    }
  };