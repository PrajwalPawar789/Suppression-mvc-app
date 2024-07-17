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

// Function to check the database for a match based on email, company name, and domain
async function checkDatabase(email, companyName, domain) {
  const client = await pool.connect();
  try {
    const query = `
      SELECT 
        CASE WHEN EXISTS (
          SELECT 1 FROM public.dnc_suppression WHERE email_address = $1
        ) THEN 'Match' ELSE 'Unmatch' END AS email_status,
        CASE WHEN EXISTS (
          SELECT 1 FROM public.dnc_company WHERE dnc_company_name = $2
        ) THEN 'Match' ELSE 'Unmatch' END AS company_status,
        CASE WHEN EXISTS (
          SELECT 1 FROM public.dnc_company WHERE domain = $3
        ) THEN 'Match' ELSE 'Unmatch' END AS domain_status;
    `;
    const result = await client.query(query, [email, companyName, domain]);
    const row = result.rows[0];
    return row ? row : { email_status: 'Unmatch', company_status: 'Unmatch', domain_status: 'Unmatch' };
  } catch (error) {
    console.error("Database query error:", error);
    return { email_status: 'Error', company_status: 'Error', domain_status: 'Error' };
  } finally {
    client.release();
  }
}

// Function to process the uploaded file
async function processFile(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);

  // Check if the required columns are present
  const emailIndex = worksheet.getRow(1).values.indexOf('Email ID');
  const companyNameIndex = worksheet.getRow(1).values.indexOf('Company Name');
  const domainIndex = worksheet.getRow(1).values.indexOf('Domain');
  if (emailIndex === -1 || companyNameIndex === -1 || domainIndex === -1) {
    return { error: 'Missing required columns: Email ID, Company Name, or Domain' };
  }

  // Add the "Match Status", "Company Status", and "Domain Status" columns
  const statusColumn = worksheet.getColumn(worksheet.columnCount + 1);
  statusColumn.header = 'Match Status';
  const companyStatusColumn = worksheet.getColumn(worksheet.columnCount + 2);
  companyStatusColumn.header = 'Company Status';
  const domainStatusColumn = worksheet.getColumn(worksheet.columnCount + 3);
  domainStatusColumn.header = 'Domain Status';

  for (let i = 2; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    const email = normalizeString(row.getCell(emailIndex).value);
    const companyName = normalizeString(row.getCell(companyNameIndex).value);
    const domain = normalizeString(row.getCell(domainIndex).value);
    const { email_status, company_status, domain_status } = await checkDatabase(email, companyName, domain);
    row.getCell(statusColumn.number).value = email_status;
    row.getCell(companyStatusColumn.number).value = company_status;
    row.getCell(domainStatusColumn.number).value = domain_status;
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