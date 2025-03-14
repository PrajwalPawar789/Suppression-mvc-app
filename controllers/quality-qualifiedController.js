const multer = require("multer");
const fs = require("fs");
const { Pool } = require("pg");
const ExcelJS = require("exceljs");
const logger = require("./logger"); // Ensure you have a logger module

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

// Multer configuration for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

// Helper function to format dates consistently
function formatDateForDatabase(dateStr) {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.log('Invalid date input:', dateStr);
      return '23-Sep-24';
    }
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedDate = `${String(date.getDate()).padStart(2, '0')}-${months[date.getMonth()]}-${String(date.getFullYear()).slice(-2)}`;
    console.log('Formatted date:', formattedDate);
    return formattedDate;
  } catch (error) {
    console.error('Date formatting error:', error);
    return '23-Sep-24';
  }
}

// Function to check the database for a match based on left_3, left_4, and email
async function checkDatabase(
  left3,
  left4,
  email,
  clientCode,
  dateFilter,
  linkedinLink,
  end_client_name,
  
) {
  const client = await pool.connect();
  try {
    const query = `
    WITH data AS (
    SELECT 
        $1 AS linkedin_link,
        $2 AS client_code,
        $3 AS left_3,
        $4 AS left_4,
        $5 AS email_id,
        TO_DATE($6, 'DD-Mon-YY') AS lead_date,  -- Convert input date to DATE type
        $7 AS end_client_name_input  -- Optional parameter (pass NULL if not needed)
),
filtered_campaigns AS (
    SELECT
        CASE
            WHEN TO_DATE(c.date_, 'DD-Mon-YY') > d.lead_date THEN 'Still Suppressed'  -- Cast c.date_ to DATE
                ELSE 'Suppression Cleared'
            END AS date_status,
        CASE
            WHEN c.left_3 = d.left_3 OR c.left_4 = d.left_4 THEN 'Match'
            ELSE 'Unmatch'
        END AS match_status,
        CASE
            WHEN c.email = d.email_id THEN 'Match'
            ELSE 'unmatch (' || c.email || ')'
        END AS email_status,
        CASE
            WHEN c.client = d.client_code THEN 'Match (' || c.client || ')'
            ELSE 'Unmatch'
        END AS client_code_status,
        CASE
            WHEN c.linkedin_link = d.linkedin_link THEN 'Match'
            ELSE 'unmatch (' || c.linkedin_link || ')'
        END AS linkedin_link_status,
        CASE
            WHEN d.end_client_name_input IS NULL THEN 'Not Checked'
            WHEN c.end_client_name = d.end_client_name_input THEN 'Match'
            ELSE 'Unmatch'
        END AS end_client_name_status
    FROM
        public.quality_qualified c
    JOIN
        data d ON c.client = d.client_code
    WHERE
        (c.linkedin_link = d.linkedin_link
        OR (c.left_3 = d.left_3 OR c.left_4 = d.left_4)
        OR c.email = d.email_id)
        AND NOT (c.client = 'TE16' AND c.end_client_name IN ('MSFT', 'Microsoft'))
),
final_result AS (
    SELECT * FROM filtered_campaigns
    WHERE date_status = 'Still Suppressed'
    UNION ALL
    SELECT * FROM filtered_campaigns
    WHERE date_status = 'Suppression Cleared' AND NOT EXISTS (
        SELECT 1 FROM filtered_campaigns WHERE date_status = 'Still Suppressed'
    )
)
SELECT 
    COALESCE(date_status, 'Fresh Lead GTG') AS date_status,
    COALESCE(match_status, 'Unmatch') AS match_status,
    COALESCE(email_status, 'Unmatch') AS email_status,
    COALESCE(client_code_status, 'Unmatch') AS client_code_status,
    COALESCE(linkedin_link_status, 'Unmatch') AS linkedin_link_status,
    COALESCE(end_client_name_status, 
        CASE 
            WHEN (SELECT end_client_name_input FROM data) IS NULL 
            THEN 'Not Checked' 
            ELSE 'Unmatch' 
        END
    ) AS end_client_name_status
FROM (
    SELECT * FROM final_result
    UNION ALL
    SELECT 
        'Fresh Lead GTG' AS date_status, 
        'Unmatch' AS match_status, 
        'Unmatch' AS email_status, 
        'Unmatch' AS client_code_status, 
        'Unmatch' AS linkedin_link_status,
        CASE 
            WHEN (SELECT end_client_name_input FROM data) IS NULL 
            THEN 'Not Checked' 
            ELSE 'Unmatch' 
        END AS end_client_name_status
    WHERE NOT EXISTS (SELECT 1 FROM final_result)
) AS subquery
LIMIT 1;
    `;

    const formattedDate = formatDateForDatabase(dateFilter);
    console.log('Using date for query:', formattedDate);

    const result = await client.query(query, [
      linkedinLink,
      clientCode,
      left3,
      left4,
      email,
      formattedDate,
      end_client_name
    ]);

    const row = result.rows[0];

    console.log("Row Response from Query: ", row)
    if (row) {
      return {
        dateStatus: row.date_status,
        matchStatus: row.match_status,
        emailStatus: row.email_status,
        clientCodeStatus: row.client_code_status,
        linkedinLinkStatus: row.linkedin_link_status,
        end_client_nameStatus: row.end_client_name_status,
      };
    }
    return {
      dateStatus: "Fresh Lead GTG",
      matchStatus: "Unmatch",
      emailStatus: "Unmatch",
      clientCodeStatus: "Unmatch",
      linkedinLinkStatus: "Unmatch",
      end_client_nameStatus: "Unmatch",
    };
  } catch (error) {
    console.error("Database query error:", error);
    return {
      dateStatus: "Error",
      matchStatus: "Error",
      emailStatus: "Error",
      clientCodeStatus: "Error",
      linkedinLinkStatus: "Error",
      end_client_nameStatus: "Error"
    };
  } finally {
    client.release();
  }
}

// Add this function to fileController.js
async function checkDatabaseAPI(req, res) {
  const { left3, left4, email, clientCode, dateFilter, linkedinLink, end_client_name } = req.body;

  try {
    const result = await checkDatabase(left3, left4, email, clientCode, dateFilter, linkedinLink, end_client_name);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in checkDatabaseAPI:", error);
    return res.status(500).json({
      message: "An error occurred while checking the database.",
      error: error.message,
    });
  }
}

async function processFile(username, filePath, clientCode, dateFilter, end_client_name) {

  try {
    console.log("Processing file with date:", dateFilter);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1);

    // Check if all required column names are present
    const requiredColumns = [
      "Company Name",
      "First Name",
      "Last Name",
      "Email ID",
      "Phone Number",
      "linkedinLink",
    ];
    const missingColumns = requiredColumns.filter(
      (colName) => !worksheet.getRow(1).values.includes(colName)
    );
    if (missingColumns.length > 0) {
      return { error: `Missing columns: ${missingColumns.join(", ")}` };
    }

    // Proceed with processing the file
    let companyIndex,
      firstNameIndex,
      lastNameIndex,
      emailIndex,
      phoneIndex,
      linkedinLinkIndex;
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      switch (cell.value) {
        case "Company Name":
          companyIndex = colNumber;
          break;
        case "First Name":
          firstNameIndex = colNumber;
          break;
        case "Last Name":
          lastNameIndex = colNumber;
          break;
        case "Email ID":
          emailIndex = colNumber;
          break;
        case "Phone Number":
          phoneIndex = colNumber;
          break;
        case "linkedinLink":
          linkedinLinkIndex = colNumber;
          break;
      }
    });

    const statusColumn = worksheet.getColumn(worksheet.columnCount + 1);
    statusColumn.header = "Match Status";

    const clientCodeStatusColumn = worksheet.getColumn(worksheet.columnCount + 2);
    clientCodeStatusColumn.header = "Client Code Status";

    const dateStatusColumn = worksheet.getColumn(worksheet.columnCount + 3);
    dateStatusColumn.header = "Date Status";

    const emailStatusColumn = worksheet.getColumn(worksheet.columnCount + 4);
    emailStatusColumn.header = "Email Status";

    const linkedinLinkStatusColumn = worksheet.getColumn(worksheet.columnCount + 5);
    linkedinLinkStatusColumn.header = "LinkedIn Link Status";

    const end_client_nameStatusColumn = worksheet.getColumn(worksheet.columnCount + 6);
    end_client_nameStatusColumn.header = "End Client Name Status";

    // Define matchStatusColumn
    const matchStatusColumn = statusColumn; // Ensure this is defined

    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      // Check if row is empty
      if (!row.getCell(emailIndex).value && 
          !row.getCell(firstNameIndex).value && 
          !row.getCell(lastNameIndex).value && 
          !row.getCell(companyIndex).value) {
        continue; // Skip empty rows
      }

      const firstName = normalizeString(row.getCell(firstNameIndex).value);
      const lastName = normalizeString(row.getCell(lastNameIndex).value);
      const companyName = normalizeString(row.getCell(companyIndex).value);
      const email = normalizeString(row.getCell(emailIndex).value);
      const linkedinLink = normalizeString(row.getCell(linkedinLinkIndex).value);

      const calculatedLeft3 = `${firstName.substring(0, 3)}${lastName.substring(0, 3)}${companyName.substring(0, 3)}`;
      const calculatedLeft4 = `${firstName.substring(0, 4)}${lastName.substring(0, 4)}${companyName.substring(0, 4)}`;

      const formattedDate = formatDateForDatabase(dateFilter);
      console.log('Using date for query:', formattedDate);

      // Call your checkDatabase function here
      const dbResult = await checkDatabase(
        calculatedLeft3,
        calculatedLeft4,
        email,
        clientCode,
        formattedDate,
        linkedinLink,
        end_client_name || 'NULL'  // Pass 'NULL' as a string if empty
      );

      // Update the row with results
      row.getCell(dateStatusColumn.number).value = dbResult.dateStatus;
      row.getCell(emailStatusColumn.number).value = dbResult.emailStatus;
      row.getCell(clientCodeStatusColumn.number).value = dbResult.clientCodeStatus;
      row.getCell(matchStatusColumn.number).value = dbResult.matchStatus; // Use matchStatusColumn here
      row.getCell(linkedinLinkStatusColumn.number).value = dbResult.linkedinLinkStatus;
      row.getCell(end_client_nameStatusColumn.number).value = dbResult.end_client_nameStatus;

      await row.commit();
    }

    const newFilePath = "Updated-" + Date.now() + ".xlsx";
    await workbook.xlsx.writeFile(newFilePath);
    console.log("File saved successfully");

    return newFilePath;
  } catch (error) {
    console.error("Error processing file:", error);
    throw error; // Rethrow to be handled by the caller
  }
}

// Read the Excel file, calculate left_3 and left_4, check the database, and add status
async function processFileDynamicQuery(username, filePath, dateFilter) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);

  // Check if all required column names are present
  const requiredColumns = [
    "Company Name",
    "First Name",
    "Last Name",
    "Email ID",
    "Phone Number",
    "linkedinLink",
  ];
  const missingColumns = requiredColumns.filter(
    (colName) => !worksheet.getRow(1).values.includes(colName)
  );
  if (missingColumns.length > 0) {
    return { error: `Missing columns: ${missingColumns.join(", ")}` };
  }

  // Proceed with processing the file
  let companyIndex,
    firstNameIndex,
    lastNameIndex,
    emailIndex,
    phoneIndex,
    linkedinLinkIndex;
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    switch (cell.value) {
      case "Company Name":
        companyIndex = colNumber;
        break;
      case "First Name":
        firstNameIndex = colNumber;
        break;
      case "Last Name":
        lastNameIndex = colNumber;
        break;
      case "Email ID":
        emailIndex = colNumber;
        break;
      case "Phone Number":
        phoneIndex = colNumber;
        break;
      case "linkedinLink":
        linkedinLinkIndex = colNumber;
        break;
    }
  });

  const dateStatusColumn = worksheet.getColumn(worksheet.columnCount + 1);
  dateStatusColumn.header = "Date Status";

  const emailStatusColumn = worksheet.getColumn(worksheet.columnCount + 2);
  emailStatusColumn.header = "Email Status";

  const clientCodeStatusColumn = worksheet.getColumn(worksheet.columnCount + 3);
  clientCodeStatusColumn.header = "Client Code Status";

  const matchStatusColumn = worksheet.getColumn(worksheet.columnCount + 4);
  matchStatusColumn.header = "Match Status";

  const linkedinLinkStatusColumn = worksheet.getColumn(
    worksheet.columnCount + 5
  );
  linkedinLinkStatusColumn.header = "LinkedIn Link Status";

  for (let i = 2; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    
    // Check if row is empty
    if (!row.getCell(emailIndex).value && 
        !row.getCell(firstNameIndex).value && 
        !row.getCell(lastNameIndex).value && 
        !row.getCell(companyIndex).value) {
      continue; // Skip empty rows
    }

    const firstName = normalizeString(row.getCell(firstNameIndex).value);
    const lastName = normalizeString(row.getCell(lastNameIndex).value);
    const companyName = normalizeString(row.getCell(companyIndex).value);
    const email = normalizeString(row.getCell(emailIndex).value);
    const linkedinLink = normalizeString(row.getCell(linkedinLinkIndex).value);

    const calculatedLeft3 = `${firstName.substring(0, 3)}${lastName.substring(0, 3)}${companyName.substring(0, 3)}`;
    const calculatedLeft4 = `${firstName.substring(0, 4)}${lastName.substring(0, 4)}${companyName.substring(0, 4)}`;

    // Use the formatted date directly
    const formattedDate = formatDateForDatabase(dateFilter);

    // Use the updated dynamic query with date comparison and client codes
    const dynamicQuery = `
    WITH data AS (
        SELECT 
            $1 AS left_3,
            $2 AS left_4,
            $3 AS email_id,
            $4 AS linkedin_link,
            $5 AS lead_date,
            ARRAY['TE16', 'DI31', 'AD62', 'AN12', 'DY78', 'MA99', 'NT26', 'UE88', 'AR13', 'TE72', 'DY78'] AS client_codes
    ),
    filtered_campaigns AS (
        SELECT
            CASE
                WHEN to_date(c.date_, 'DD-Mon-YY') > to_date(d.lead_date, 'DD-Mon-YY') THEN 'Still Suppressed'
                ELSE 'Suppression Cleared'
            END AS date_status,
            CASE
                WHEN c.left_3 = d.left_3 OR c.left_4 = d.left_4 THEN 'Match'
                ELSE 'Unmatch'
            END AS match_status,
            CASE
                WHEN c.email = d.email_id THEN 'Match'
                ELSE 'unmatch (' || c.email || ')'
            END AS email_status,
            CASE
                WHEN c.client = ANY(d.client_codes) THEN 'Match (' || c.client || ')'
                ELSE 'Unmatch'
            END AS client_code_status,
            CASE
                WHEN c.linkedin_link = d.linkedin_link THEN 'Match'
                ELSE 'unmatch (' || c.linkedin_link || ')'
            END AS linkedin_link_status
        FROM
            public.quality_qualified c
        JOIN
            data d ON c.client = ANY(d.client_codes)
        WHERE
            (c.linkedin_link = d.linkedin_link
            OR (c.left_3 = d.left_3 OR c.left_4 = d.left_4)
            OR c.email = d.email_id)
    )
    SELECT 
        date_status,
        match_status,
        email_status,
        client_code_status,
        linkedin_link_status
    FROM filtered_campaigns
    LIMIT 1;
    `;

    const dbResult = await pool.query(dynamicQuery, [
      calculatedLeft3,
      calculatedLeft4,
      email,
      linkedinLink,
      formattedDate // Pass the formatted date directly
    ]);

    // Update the row with results
    const resultRow = dbResult.rows[0];
    if (resultRow) {
      row.getCell(dateStatusColumn.number).value = resultRow.date_status;
      row.getCell(emailStatusColumn.number).value = resultRow.email_status;
      row.getCell(clientCodeStatusColumn.number).value = resultRow.client_code_status;
      row.getCell(matchStatusColumn.number).value = resultRow.match_status;
      row.getCell(linkedinLinkStatusColumn.number).value = resultRow.linkedin_link_status;
    }

    await row.commit();
  }

  const newFilePath = "Updated-" + Date.now() + ".xlsx";
  await workbook.xlsx.writeFile(newFilePath);
  return newFilePath;
}

async function processFileDynamicQueryMSFT(username, filePath, dateFilter) {

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);

  // console.log("inside msft")
  // Check if all required column names are present
  const requiredColumns = [
    "Company Name",
    "First Name",
    "Last Name",
    "Email ID",
    "Phone Number",
    "linkedinLink", // Added linkedinLink as a required column
  ];
  const missingColumns = requiredColumns.filter(
    (colName) => !worksheet.getRow(1).values.includes(colName)
  );
  if (missingColumns.length > 0) {
    return { error: `Missing columns: ${missingColumns.join(", ")}` };
  }

  // Proceed with processing the file
  let companyIndex,
    firstNameIndex,
    lastNameIndex,
    emailIndex,
    phoneIndex,
    linkedinLinkIndex;
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    switch (cell.value) {
      case "Company Name":
        companyIndex = colNumber;
        break;
      case "First Name":
        firstNameIndex = colNumber;
        break;
      case "Last Name":
        lastNameIndex = colNumber;
        break;
      case "Email ID":
        emailIndex = colNumber;
        break;
      case "Phone Number":
        phoneIndex = colNumber;
        break;
      case "linkedinLink":
        linkedinLinkIndex = colNumber;
        break;
    }
  });

  const dateStatusColumn = worksheet.getColumn(worksheet.columnCount + 1);
  dateStatusColumn.header = "Date Status";

  const emailStatusColumn = worksheet.getColumn(worksheet.columnCount + 2);
  emailStatusColumn.header = "Email Status";

  const clientCodeStatusColumn = worksheet.getColumn(worksheet.columnCount + 3);
  clientCodeStatusColumn.header = "Client Code Status";

  const matchStatusColumn = worksheet.getColumn(worksheet.columnCount + 4);
  matchStatusColumn.header = "Match Status";

  const linkedinLinkStatusColumn = worksheet.getColumn(worksheet.columnCount + 5);
  linkedinLinkStatusColumn.header = "LinkedIn Link Status";

  const endClientNameStatusColumn = worksheet.getColumn(worksheet.columnCount + 6);
  endClientNameStatusColumn.header = "End Client Name Status";

  for (let i = 2; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    
    // Check if row is empty
    if (!row.getCell(emailIndex).value && 
        !row.getCell(firstNameIndex).value && 
        !row.getCell(lastNameIndex).value && 
        !row.getCell(companyIndex).value) {
      continue; // Skip empty rows
    }

    const firstName = normalizeString(row.getCell(firstNameIndex).value);
    const lastName = normalizeString(row.getCell(lastNameIndex).value);
    const companyName = normalizeString(row.getCell(companyIndex).value);
    const email = normalizeString(row.getCell(emailIndex).value);
    const linkedinLink = normalizeString(row.getCell(linkedinLinkIndex).value);

    const calculatedLeft3 = `${firstName.substring(0, 3)}${lastName.substring(0, 3)}${companyName.substring(0, 3)}`;
    const calculatedLeft4 = `${firstName.substring(0, 4)}${lastName.substring(0, 4)}${companyName.substring(0, 4)}`;

    const left_3 = calculatedLeft3;
    const left_4 = calculatedLeft4;
    // Use the query for client code 'MSFT'
    const dynamicQueryMSFT = `
      WITH data AS (
          SELECT 
              $1 AS linkedin_link,
              'TE16' AS client_code,
              $2 AS left_3,
              $3 AS left_4,
              $4 AS email_id,
              $5 AS lead_date,
              'MSFT' AS end_client_name_1,
              'Microsoft' AS end_client_name_2
      ),
      filtered_campaigns AS (
          SELECT
              CASE
                  WHEN to_date(c.date_, 'DD-Mon-YY') > to_date(d.lead_date, 'DD-Mon-YY') THEN 'Still Suppressed'
                  ELSE 'Suppression Cleared'
              END AS date_status,
              CASE
                  WHEN c.left_3 = d.left_3 OR c.left_4 = d.left_4 THEN 'Match'
                  ELSE 'Unmatch'
              END AS match_status,
              CASE
                  WHEN c.email = d.email_id THEN 'Match'
                  ELSE 'unmatch (' || c.email || ')'
              END AS email_status,
              CASE
                  WHEN c.client = d.client_code THEN 'Match (' || c.client || ')'
                  ELSE 'Unmatch'
              END AS client_code_status,
              CASE
                  WHEN c.linkedin_link = d.linkedin_link THEN 'Match'
                  ELSE 'unmatch (' || c.linkedin_link || ')'
              END AS linkedin_link_status,
              CASE
                  WHEN c.end_client_name = d.end_client_name_1 THEN 'Match (' || d.end_client_name_1 || ')'
                  WHEN c.end_client_name = d.end_client_name_2 THEN 'Match (' || d.end_client_name_2 || ')'
                  ELSE 'Unmatch'
              END AS end_client_name_status
          FROM
              public.quality_qualified c
          JOIN
              data d ON c.client = d.client_code
          WHERE
              c.linkedin_link = d.linkedin_link
              OR (c.left_3 = d.left_3 OR c.left_4 = d.left_4)
              OR c.email = d.email_id
      ),
      final_result AS (
          SELECT * FROM filtered_campaigns
          WHERE date_status = 'Still Suppressed'
          UNION ALL
          SELECT * FROM filtered_campaigns
          WHERE date_status = 'Suppression Cleared' AND NOT EXISTS (
              SELECT 1 FROM filtered_campaigns WHERE date_status = 'Still Suppressed'
          )
      )
      SELECT 
          COALESCE(date_status, 'Fresh Lead GTG') AS date_status,
          COALESCE(match_status, 'Unmatch') AS match_status,
          COALESCE(email_status, 'Unmatch') AS email_status,
          COALESCE(client_code_status, 'Unmatch') AS client_code_status,
          COALESCE(linkedin_link_status, 'Unmatch') AS linkedin_link_status,
          COALESCE(end_client_name_status, 'Unmatch') AS end_client_name_status
      FROM (
          SELECT * FROM final_result
          UNION ALL
          SELECT 'Fresh Lead GTG' AS date_status, 'Unmatch' AS match_status, 'Unmatch' AS email_status, 'Unmatch' AS client_code_status, 'Unmatch' AS linkedin_link_status, 'Unmatch' AS end_client_name_status
          WHERE NOT EXISTS (SELECT 1 FROM final_result)
      ) AS subquery
      LIMIT 1;
    `;

    // Execute the dynamic query with parameterized values
    const formattedDate = formatDateForDatabase(dateFilter);
    const dbResult = await pool.query(dynamicQueryMSFT, [
      linkedinLink,
      calculatedLeft3,
      calculatedLeft4,
      email,
      formattedDate
    ]);

    row.getCell(dateStatusColumn.number).value = dbResult.rows[0].date_status;
    row.getCell(emailStatusColumn.number).value = dbResult.rows[0].email_status;
    row.getCell(clientCodeStatusColumn.number).value = dbResult.rows[0].client_code_status;
    row.getCell(matchStatusColumn.number).value = dbResult.rows[0].match_status;
    row.getCell(linkedinLinkStatusColumn.number).value = dbResult.rows[0].linkedin_link_status;
    row.getCell(endClientNameStatusColumn.number).value = dbResult.rows[0].end_client_name_status;


     // Log the lead check
     logger.info(
      `${username} - checking MSFT lead ${i - 1}: email=${email}, left3=${calculatedLeft3}, left4=${calculatedLeft4}, linkedinLink=${linkedinLink}`
    );

    row.commit();
  }

  const newFilePath = "Updated-" + Date.now() + ".xlsx";
  await workbook.xlsx.writeFile(newFilePath);
  return newFilePath;
}

async function processSingleEntry(req, res) {
  const { firstname, lastname, companyname, phonenumber, linkedinlink, emailid, dateFilter } = req.body;

  // Validate input
  if (!firstname || !lastname || !companyname || !phonenumber || !linkedinlink || !emailid || !dateFilter) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const calculatedLeft3 = `${firstname.substring(0, 3)}${lastname.substring(0, 3)}${companyname.substring(0, 3)}`;
  const calculatedLeft4 = `${firstname.substring(0, 4)}${lastname.substring(0, 4)}${companyname.substring(0, 4)}`;

// console.log("Logging left_3 and left_4", left_3, left_4);

  const dynamicQueryMSFT = `
    WITH data AS (
          SELECT 
              $1 AS linkedin_link,
              'TE16' AS client_code,
              $2 AS left_3,
              $3 AS left_4,
              $4 AS email_id,
              $5 AS lead_date,
              'MSFT' AS end_client_name_1,
              'Microsoft' AS end_client_name_2
      ),
      filtered_campaigns AS (
          SELECT
              CASE
                  WHEN to_date(c.date_, 'DD-Mon-YY') > to_date(d.lead_date, 'DD-Mon-YY') THEN 'Still Suppressed'
                  ELSE 'Suppression Cleared'
              END AS date_status,
              CASE
                  WHEN c.left_3 = d.left_3 OR c.left_4 = d.left_4 THEN 'Match'
                  ELSE 'Unmatch'
              END AS match_status,
              CASE
                  WHEN c.email = d.email_id THEN 'Match'
                  ELSE 'unmatch (' || c.email || ')'
              END AS email_status,
              CASE
                  WHEN c.client = d.client_code THEN 'Match (' || c.client || ')'
                  ELSE 'Unmatch'
              END AS client_code_status,
              CASE
                  WHEN c.linkedin_link = d.linkedin_link THEN 'Match'
                  ELSE 'unmatch (' || c.linkedin_link || ')'
              END AS linkedin_link_status,
              CASE
                  WHEN c.end_client_name = d.end_client_name_1 THEN 'Match (' || d.end_client_name_1 || ')'
                  WHEN c.end_client_name = d.end_client_name_2 THEN 'Match (' || d.end_client_name_2 || ')'
                  ELSE 'Unmatch'
              END AS end_client_name_status
          FROM
              public.quality_qualified c
          JOIN
              data d ON c.client = d.client_code
          WHERE
              c.linkedin_link = d.linkedin_link
              OR (c.left_3 = d.left_3 OR c.left_4 = d.left_4)
              OR c.email = d.email_id
      ),
      final_result AS (
          SELECT * FROM filtered_campaigns
          WHERE date_status = 'Still Suppressed'
          UNION ALL
          SELECT * FROM filtered_campaigns
          WHERE date_status = 'Suppression Cleared' AND NOT EXISTS (
              SELECT 1 FROM filtered_campaigns WHERE date_status = 'Still Suppressed'
          )
      )
      SELECT 
          COALESCE(date_status, 'Fresh Lead GTG') AS date_status,
          COALESCE(match_status, 'Unmatch') AS match_status,
          COALESCE(email_status, 'Unmatch') AS email_status,
          COALESCE(client_code_status, 'Unmatch') AS client_code_status,
          COALESCE(linkedin_link_status, 'Unmatch') AS linkedin_link_status,
          COALESCE(end_client_name_status, 'Unmatch') AS end_client_name_status
      FROM (
          SELECT * FROM final_result
          UNION ALL
          SELECT 'Fresh Lead GTG' AS date_status, 'Unmatch' AS match_status, 'Unmatch' AS email_status, 'Unmatch' AS client_code_status, 'Unmatch' AS linkedin_link_status, 'Unmatch' AS end_client_name_status
          WHERE NOT EXISTS (SELECT 1 FROM final_result)
      ) AS subquery
      LIMIT 1;
  `;

  try {
    const dbResult = await pool.query(dynamicQueryMSFT, [
      linkedinlink,
      calculatedLeft3,
      calculatedLeft4,
      emailid, // Pass the email ID from the request body
      dateFilter,
    ]);

    // Return the result
    if (dbResult.rows.length > 0) {
      return res.json(dbResult.rows[0]);
    } else {
      return res.json({ message: 'No matching records found.' });
    }
  } catch (error) {
    console.error('Database query failed:', error);
    return res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
}

// Function to process a single entry
async function processSingleAllClient({ firstname, lastname, companyname, phonenumber, linkedinlink, emailid, dateFilter }) {
  // Validate required inputs
  if (!firstname || !lastname || !companyname || !emailid || !linkedinlink || !dateFilter) {
    return { error: "Missing required fields" };
  }

  // Validate and convert dateFilter to an integer
  const dateFilterValue = parseInt(dateFilter, 10);
  if (isNaN(dateFilterValue)) {
    return { error: "Invalid dateFilter value" };
  }
  const daysToFilter = dateFilterValue * 30;

  // Calculate left 3 and left 4 directly
  const left3 = `${firstname.substring(0, 3)}${lastname.substring(0, 3)}${companyname.substring(0, 3)}`;
  const left4 = `${firstname.substring(0, 4)}${lastname.substring(0, 4)}${companyname.substring(0, 4)}`;

  // Prepare the dynamic query
  const dynamicQuery = `
    WITH data AS (
      SELECT 
        $1 AS left_3,
        $2 AS left_4,
        $3 AS email_id,
        $4 AS linkedin_link,
        ARRAY['TE16', 'DI31', 'AD62', 'AN12', 'DY78', 'MA99', 'NT26', 'UE88', 'AR13', 'TE72', 'DY78'] AS client_codes
    ),
    filtered_campaigns AS (
      SELECT
        CASE
          WHEN (current_date - to_date(c.date_, 'DD-Mon-YY'))::int > $5 THEN 'Suppression Cleared'
          ELSE 'Still Suppressed'
        END AS date_status,
        CASE
          WHEN c.left_3 = d.left_3 OR c.left_4 = d.left_4 THEN 'Match'
          ELSE 'Unmatch'
        END AS match_status,
        CASE
          WHEN c.email = d.email_id THEN 'Match'
          ELSE 'unmatch (' || c.email || ')'
        END AS email_status,
        CASE
          WHEN c.client = ANY(d.client_codes) THEN 'Match (' || c.client || ')'
          ELSE 'Unmatch'
        END AS client_code_status,
        CASE
          WHEN c.linkedin_link = d.linkedin_link THEN 'Match'
          ELSE 'unmatch (' || c.linkedin_link || ')'
        END AS linkedin_link_status
      FROM
        public.quality_qualified c
      JOIN
        data d ON c.client = ANY(d.client_codes)
      WHERE
        (c.linkedin_link = d.linkedin_link
        OR (c.left_3 = d.left_3 OR c.left_4 = d.left_4)
        OR c.email = d.email_id)
        AND NOT (c.client = 'TE16' AND c.end_client_name IN ('MSFT', 'Microsoft'))
    ),
    final_result AS (
      SELECT * FROM filtered_campaigns
      WHERE date_status = 'Still Suppressed'
      UNION ALL
      SELECT * FROM filtered_campaigns
      WHERE date_status = 'Suppression Cleared' AND NOT EXISTS (
          SELECT 1 FROM filtered_campaigns WHERE date_status = 'Still Suppressed'
      )
    )
    SELECT 
      COALESCE(date_status, 'Fresh Lead GTG') AS date_status,
      COALESCE(match_status, 'Unmatch') AS match_status,
      COALESCE(email_status, 'Unmatch') AS email_status,
      COALESCE(client_code_status, 'Unmatch') AS client_code_status,
      COALESCE(linkedin_link_status, 'Unmatch') AS linkedin_link_status
    FROM (
      SELECT * FROM final_result
      UNION ALL
      SELECT 'Fresh Lead GTG' AS date_status, 'Unmatch' AS match_status, 'Unmatch' AS email_status, 'Unmatch' AS client_code_status, 'Unmatch' AS linkedin_link_status
      WHERE NOT EXISTS (SELECT 1 FROM final_result)
    ) AS subquery
    LIMIT 1;
  `;

  try {
    console.log("Executing query...");
    const dbResult = await pool.query(dynamicQuery, [
      left3,
      left4,
      emailid,
      linkedinlink,
      daysToFilter,
    ]);
    console.log("Query executed.");

    if (dbResult.rows.length === 0) {
      return { 
        dateStatus: 'Fresh Lead GTG', 
        matchStatus: 'Unmatch', 
        emailStatus: 'Unmatch', 
        clientCodeStatus: 'Unmatch', 
        linkedinLinkStatus: 'Unmatch' 
      };
    }

    return {
      dateStatus: dbResult.rows[0].date_status,
      emailStatus: dbResult.rows[0].email_status,
      clientCodeStatus: dbResult.rows[0].client_code_status,
      matchStatus: dbResult.rows[0].match_status,
      linkedinLinkStatus: dbResult.rows[0].linkedin_link_status,
    };
  } catch (error) {
    console.error('Database query error:', error.message);
    return { error: 'Database query failed' };
  }
}


module.exports = {
  checkDatabaseAPI,
  upload,
  processSingleAllClient,
  processSingleEntry,
  processFile,
  processFileDynamicQuery,
  processFileDynamicQueryMSFT,
  uploadFile: async (req, res) => {
    const username = req.session.username || 'Anonymous';
  
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }
  
    if (!req.file.originalname.endsWith(".xlsx")) {
      return res.status(400).send("Uploaded file is not an Excel file.");
    }
  
    const clientCode = req.body.clientCode;
    const dateFilter = req.body.dateFilter;
    const end_client_name = req.body.end_client_name;
  
    console.log('Date received in controller:', dateFilter);
  
    try {
      console.log("Processing file for client code:", clientCode);
      let result;
  
      if (clientCode === "All") {
        result = await processFileDynamicQuery(username, req.file.path, dateFilter);
      } else if (clientCode === "MSFT") {
        result = await processFileDynamicQueryMSFT(username, req.file.path, dateFilter);
      } else {
        result = await processFile(username, req.file.path, clientCode, dateFilter, end_client_name);
      }

      // Delete the uploaded file after processing
      fs.unlinkSync(req.file.path);

      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      // Instead of returning JSON, redirect to the file download
      res.download(result, (err) => {
        if (err) {
          console.error("Error sending file:", err);
          return res.status(500).send("Error sending file.");
        }
        console.log("File sent successfully:", result);
      });
    } catch (error) {
      console.error("Error processing file:", error);
      return res.status(500).json({
        message: "An error occurred while processing the file.",
        error: error.message,
      });
    }
  },
};
