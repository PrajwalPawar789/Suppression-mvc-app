const multer = require("multer");
const fs = require("fs");
const { Pool } = require("pg");
const ExcelJS = require("exceljs");

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

// Function to check the database for a match based on left_3, left_4, and email
async function checkDatabase(
  left3,
  left4,
  email,
  clientCode,
  dateFilter,
  linkedinLink
) {
  const client = await pool.connect();
  try {
    const query = `
  WITH data AS (
    SELECT $1 AS linkedin_link,
           $2 AS client_code,
           $3 AS left_3,
           $4 AS left_4,
           $5 AS email_id
  ),
  filtered_campaigns AS (
    SELECT
      CASE
        WHEN (current_date - to_date(c.date_, 'DD-Mon-YY'))::int > $6 THEN 'Suppression Cleared'
        ELSE 'Still Suppressed'
      END AS date_status,
      CASE
        WHEN c.left_3 = d.left_3 AND c.left_4 = d.left_4 THEN 'Match'
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
      END AS linkedin_link_status
    FROM
      public.campaigns c
    JOIN
      data d ON c.client = d.client_code
    WHERE
      (c.linkedin_link = d.linkedin_link
      OR (c.left_3 = d.left_3 AND c.left_4 = d.left_4)
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

    const result = await client.query(query, [
      linkedinLink,
      clientCode,
      left3,
      left4,
      email,
      dateFilter * 30,
    ]);
    const row = result.rows[0];
    if (row) {
      return {
        dateStatus: row.date_status,
        matchStatus: row.match_status,
        emailStatus: row.email_status,
        clientCodeStatus: row.client_code_status,
        linkedinLinkStatus: row.linkedin_link_status,
      };
    }
    return {
      dateStatus: "Fresh Lead GTG",
      matchStatus: "Unmatch",
      emailStatus: "Unmatch",
      clientCodeStatus: "Unmatch",
      linkedinLinkStatus: "Unmatch",
    };
  } catch (error) {
    console.error("Database query error:", error);
    return {
      dateStatus: "Error",
      matchStatus: "Error",
      emailStatus: "Error",
      clientCodeStatus: "Error",
      linkedinLinkStatus: "Error",
    };
  } finally {
    client.release();
  }
}

async function processFile(filePath, clientCode, dateFilter) {
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

  const statusColumn = worksheet.getColumn(worksheet.columnCount + 1);
  statusColumn.header = "Match Status";

  const clientCodeStatusColumn = worksheet.getColumn(worksheet.columnCount + 2);
  clientCodeStatusColumn.header = "Client Code Status";

  const dateStatusColumn = worksheet.getColumn(worksheet.columnCount + 3);
  dateStatusColumn.header = "Date Status";

  const emailStatusColumn = worksheet.getColumn(worksheet.columnCount + 4);
  emailStatusColumn.header = "Email Status";

  const linkedinLinkStatusColumn = worksheet.getColumn(
    worksheet.columnCount + 5
  );
  linkedinLinkStatusColumn.header = "LinkedIn Link Status";

  for (let i = 2; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    const firstName = normalizeString(row.getCell(firstNameIndex).value);
    const lastName = normalizeString(row.getCell(lastNameIndex).value);
    const companyName = normalizeString(row.getCell(companyIndex).value);
    const email = normalizeString(row.getCell(emailIndex).value);
    const linkedinLink = normalizeString(row.getCell(linkedinLinkIndex).value); // Fetch linkedinLink

    const left3 = `${firstName.substring(0, 3)}${lastName.substring(
      0,
      3
    )}${companyName.substring(0, 3)}`;
    const left4 = `${firstName.substring(0, 4)}${lastName.substring(
      0,
      4
    )}${companyName.substring(0, 4)}`;

    const dbResult = await checkDatabase(
      left3,
      left4,
      email,
      clientCode,
      dateFilter,
      linkedinLink // Pass linkedinLink to checkDatabase
    );

    row.getCell(statusColumn.number).value = dbResult.matchStatus;
    row.getCell(clientCodeStatusColumn.number).value =
      dbResult.clientCodeStatus;
    row.getCell(dateStatusColumn.number).value = dbResult.dateStatus;
    row.getCell(emailStatusColumn.number).value = dbResult.emailStatus;
    row.getCell(linkedinLinkStatusColumn.number).value =
      dbResult.linkedinLinkStatus;

    row.commit();
  }

  const newFilePath = "Updated-" + Date.now() + ".xlsx";
  await workbook.xlsx.writeFile(newFilePath);
  return newFilePath;
}

// Read the Excel file, calculate left_3 and left_4, check the database, and add status
async function processFileDynamicQuery(filePath, dateFilter) {
  console.log(dateFilter, 'dateFilter is ')
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

  const linkedinLinkStatusColumn = worksheet.getColumn(
    worksheet.columnCount + 5
  );
  linkedinLinkStatusColumn.header = "LinkedIn Link Status";

  for (let i = 2; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    const firstName = normalizeString(row.getCell(firstNameIndex).value);
    const lastName = normalizeString(row.getCell(lastNameIndex).value);
    const companyName = normalizeString(row.getCell(companyIndex).value);
    const email = normalizeString(row.getCell(emailIndex).value);
    const linkedinLink = normalizeString(row.getCell(linkedinLinkIndex).value); // Fetch linkedinLink

    const calculatedLeft3 = `${firstName.substring(0, 3)}${lastName.substring(
      0,
      3
    )}${companyName.substring(0, 3)}`;
    const calculatedLeft4 = `${firstName.substring(0, 4)}${lastName.substring(
      0,
      4
    )}${companyName.substring(0, 4)}`;

    // Validate and convert dateFilter to an integer
    const dateFilterValue = parseInt(dateFilter, 10);
    if (isNaN(dateFilterValue)) {
      return { error: "Invalid dateFilter value" };
    }
    const daysToFilter = dateFilterValue * 30;

    // Use dynamic query with parameters
    const dynamicQuery = `
WITH data AS (
    SELECT 
        $1 AS left_3,
        $2 AS left_4,
        $3 AS email_id,
        $4 AS linkedin_link,
        ARRAY['TE16', 'DI31', 'AD62', 'AN12', 'DY78', 'MA99', 'NT26', 'UE88', 'AR13', 'TE72', 'DY78' ] AS client_codes
),
filtered_campaigns AS (
    SELECT
        CASE
            WHEN (current_date - to_date(c.date_, 'DD-Mon-YY'))::int > $5 THEN 'Suppression Cleared'
            ELSE 'Still Suppressed'
        END AS date_status,
        CASE
            WHEN c.left_3 = d.left_3 AND c.left_4 = d.left_4 THEN 'Match'
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
        public.campaigns c
    JOIN
        data d ON c.client = ANY(d.client_codes)
    WHERE
        (c.linkedin_link = d.linkedin_link
        OR (c.left_3 = d.left_3 AND c.left_4 = d.left_4)
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

    // Execute the dynamic query with parameterized values
    const dbResult = await pool.query(dynamicQuery, [
      calculatedLeft3,
      calculatedLeft4,
      email,
      linkedinLink,
      daysToFilter,
    ]);

    row.getCell(dateStatusColumn.number).value = dbResult.rows[0].date_status;
    row.getCell(emailStatusColumn.number).value = dbResult.rows[0].email_status;
    row.getCell(clientCodeStatusColumn.number).value =
      dbResult.rows[0].client_code_status;
    row.getCell(matchStatusColumn.number).value = dbResult.rows[0].match_status;
    row.getCell(linkedinLinkStatusColumn.number).value =
      dbResult.rows[0].linkedin_link_status;

    row.commit();
  }

  const newFilePath = "Updated-" + Date.now() + ".xlsx";
  await workbook.xlsx.writeFile(newFilePath);
  return newFilePath;
}


async function processFileDynamicQueryMSFT(filePath, dateFilter) {
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
    const firstName = normalizeString(row.getCell(firstNameIndex).value);
    const lastName = normalizeString(row.getCell(lastNameIndex).value);
    const companyName = normalizeString(row.getCell(companyIndex).value);
    const email = normalizeString(row.getCell(emailIndex).value);
    const linkedinLink = normalizeString(row.getCell(linkedinLinkIndex).value); // Fetch linkedinLink

    const calculatedLeft3 = `${firstName.substring(0, 3)}${lastName.substring(0, 3)}${companyName.substring(0, 3)}`;
    const calculatedLeft4 = `${firstName.substring(0, 4)}${lastName.substring(0, 4)}${companyName.substring(0, 4)}`;

    // Use the query for client code 'MSFT'
    const dynamicQueryMSFT = `
      WITH data AS (
          SELECT 
              $1 AS linkedin_link,
              'TE16' AS client_code,
              $2 AS left_3,
              $3 AS left_4,
              $4 AS email_id,
              'MSFT' AS end_client_name_1,
              'Microsoft' AS end_client_name_2  -- Second possible value for end_client_name
      ),
      filtered_campaigns AS (
          SELECT
              CASE
                  WHEN (current_date - to_date(c.date_, 'DD-Mon-YY'))::int > $5 THEN 'Suppression Cleared'
                  ELSE 'Still Suppressed'
              END AS date_status,
              CASE
                  WHEN c.left_3 = d.left_3 AND c.left_4 = d.left_4 THEN 'Match'
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
              public.campaigns c
          JOIN
              data d ON c.client = d.client_code
          WHERE
              c.linkedin_link = d.linkedin_link
              OR (c.left_3 = d.left_3 AND c.left_4 = d.left_4)
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
    const dbResult = await pool.query(dynamicQueryMSFT, [
      linkedinLink,
      calculatedLeft3,
      calculatedLeft4,
      email,
      dateFilter * 30,
    ]);

    row.getCell(dateStatusColumn.number).value = dbResult.rows[0].date_status;
    row.getCell(emailStatusColumn.number).value = dbResult.rows[0].email_status;
    row.getCell(clientCodeStatusColumn.number).value = dbResult.rows[0].client_code_status;
    row.getCell(matchStatusColumn.number).value = dbResult.rows[0].match_status;
    row.getCell(linkedinLinkStatusColumn.number).value = dbResult.rows[0].linkedin_link_status;
    row.getCell(endClientNameStatusColumn.number).value = dbResult.rows[0].end_client_name_status;

    row.commit();
  }

  const newFilePath = "Updated-" + Date.now() + ".xlsx";
  await workbook.xlsx.writeFile(newFilePath);
  return newFilePath;
}

module.exports = {
  upload,
  processFile,
  processFileDynamicQuery,
  processFileDynamicQueryMSFT,
  uploadFile: async (req, res) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    // Check if the uploaded file is an Excel file
    if (!req.file.originalname.endsWith(".xlsx")) {
      return res.status(400).send("Uploaded file is not an Excel file.");
    }

    const clientCode = req.body.clientCode;
    const dateFilter = parseInt(req.body.dateFilter);

    try {
      if (clientCode === "All") {
        // Execute the dynamic query
        const result = await processFileDynamicQuery(
          req.file.path,
          dateFilter
        );
        if (result.error) {
          return res.status(400).send(result.error);
        }
        res.download(result, (err) => {
          if (err) throw err;
          fs.unlinkSync(result);
          fs.unlinkSync(req.file.path);
        });
      } else if (clientCode === "MSFT") {
        // Execute the dynamic query for MSFT
        const result = await processFileDynamicQueryMSFT(
          req.file.path,
          dateFilter
        );
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
      console.error("Error processing file:", error);
      res.status(500).send("Error processing the file.");
    }
  },
};
