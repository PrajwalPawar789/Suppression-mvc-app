const fs = require('fs');
const { Pool } = require('pg');
const ExcelJS = require('exceljs');
const logger = require('./logger');

// PostgreSQL connection settings
// const pool = new Pool({
//   user: "postgres",
//   host: "158.220.121.203",
//   database: "postgres",
//   password: "P0stgr3s%098",
//   port: 5432,
// });

const pool = new Pool({
  user: "root",
  host: "192.168.1.36",
  database: "suppression",
  password: "Scitilnam$007",
  port: 5432,
});

// Helper function to normalize domain names
const normalizeDomain = (str) => {
  if (typeof str !== 'string') {
    logger.warn('normalizeDomain: Received non-string input');
    return '';
  }

  const normalized = str.trim().toLowerCase();
  logger.info(`normalizeDomain: ${str} => ${normalized}`);
  return normalized;
}; 

// Function to check the database for a match based on domain name
async function checkDatabase(domainName, username) {
  logger.info(`${username} - Checking database for domain: ${domainName}`);
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT domain_name
      FROM public.TE16_MSFT_Accept_all_domain_suppression
      WHERE domain_name = $1;
    `;

    const result = await client.query(query, [domainName]);
    const exists = !!result.rows[0];
    
    return {
      status: exists ? 'Match' : 'Unmatch',
      domain: domainName
    };

  } catch (error) {
    logger.error(`${username} - Database error: ${error.message}`);
    return { status: 'Error', domain: domainName };
  } finally {
    client.release();
    logger.info(`${username} - Connection released for domain: ${domainName}`);
  }
}

// Function to process the uploaded file
async function processFile(filePath, username) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);

  const domainIndex = worksheet.getRow(1).values.indexOf('Domain');
  if (domainIndex === -1) {
    return { error: 'Missing required "Domain" column' };
  }

  const statusColumn = worksheet.getColumn(worksheet.columnCount + 1);
  statusColumn.header = 'Match Status';

  for (let i = 2; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    const rawDomain = row.getCell(domainIndex).value;
    const domain = normalizeDomain(rawDomain);

    try {
      const { status } = await checkDatabase(domain, username);
      row.getCell(statusColumn.number).value = status;
    } catch (error) {
      row.getCell(statusColumn.number).value = 'Error';
    }
    row.commit();
  }

  const outputPath = `TE16_Domain_Results_${Date.now()}.xlsx`;
  await workbook.xlsx.writeFile(outputPath);
  return outputPath;
}

// Single domain check API
async function checkSingleDomainAPI(req, res) {
  const { domain } = req.body;
  const username = req.session.username || 'system';

  if (!domain) {
    return res.status(400).json({ error: 'Domain parameter required' });
  }

  try {
    const normalized = normalizeDomain(domain);
    if (!normalized) {
      return res.status(400).json({ error: 'Invalid domain format' });
    }

    const result = await checkDatabase(normalized, username);
    res.json(result);

  } catch (error) {
    res.status(500).json({ 
      status: 'Error',
      error: 'Domain check failed'
    });
  }
}

// File upload handler
const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }

  try {
    const result = await processFile(req.file.path, req.session.username || 'system');
    res.download(result);
  } catch (error) {
    res.status(500).send(error.message);
  } finally {
    fs.unlinkSync(req.file.path);
  }
};

module.exports = {
  uploadFile,
  processFile,
  checkDatabase,
  checkSingleDomainAPI
};