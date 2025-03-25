const { Pool } = require('pg');
const readXlsxFile = require('read-excel-file/node');
const { format, parse, isValid } = require('date-fns');
const logger = require('./logger'); 

const pool = new Pool({
    user: "root",
    host: "192.168.1.36",
    database: "suppression",
    password: "Scitilnam$007",
    port: 5432,
});

async function insertSuppressionData(rowData, index, username) {
    const client = await pool.connect();
    try {
        const checkQuery = `
            SELECT 1 FROM public.quality_qualified 
            WHERE client = $1 AND campaign_id = $2 AND end_client_name = $3 
            AND left_3 = $4 AND left_4 = $5 AND linkedin_link = $6;
        `;
        const checkResult = await client.query(checkQuery, [
            rowData.client, rowData.campaignId, rowData.endClientName, 
            rowData.left3, rowData.left4, rowData.linkedinLink
        ]);

        if (checkResult.rows.length === 0) {
            const insertQuery = `
                INSERT INTO public.quality_qualified (
                    date_, audit_date, campaign_id, client, campaign_name, 
                    company_name, first_name, last_name, email, qa_name, 
                    linkedin_link, end_client_name, left_3, left_4
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
                );
            `;
            await client.query(insertQuery, [
                rowData.date, rowData.auditDate, rowData.campaignId, rowData.client, rowData.campaignName,
                rowData.companyName, rowData.firstName, rowData.lastName, rowData.email, rowData.qaName,
                rowData.linkedinLink, rowData.endClientName, rowData.left3, rowData.left4
            ]);
            logger.info(`${username} - Inserted new record for row ${index + 1}: email=${rowData.email}`);
        } else {
            logger.info(`${username} - Duplicate record found for row ${index + 1}: email=${rowData.email}`);
        }
    } catch (error) {
        logger.error(`${username} - Error processing row ${index + 1}: ${error.message}`);
    } finally {
        client.release();
    }
}

async function processExcel(req, res) {
    const username = req.session.username || 'Anonymous';
    logger.info(`${username} - File upload request received.`);

    if (!req.file) {
        logger.warn(`${username} - No file uploaded.`);
        return res.status(400).send('No file uploaded.');
    }

    if (!req.file.originalname.endsWith(".xlsx")) {
        logger.warn(`${username} - Uploaded file is not an Excel file.`);
        return res.status(400).send("Uploaded file is not an Excel file.");
    }

    const path = req.file.path;
    try {
        const rows = await readXlsxFile(path);
        logger.info(`${username} - Total rows (including header): ${rows.length}`);

        const headers = rows[0];
        const dataRows = rows.slice(1);
        logger.info(`${username} - Processing ${dataRows.length} rows of data.`);

        const requiredHeaders = [
            'date_', 'audit_date', 'campaign_id', 'client', 'campaign_name',
            'company_name', 'first_name', 'last_name', 'email', 'qa_name', 
            'linkedin_link', 'end_client_name', 'left_3', 'left_4'
        ];

        const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
        if (missingHeaders.length > 0) {
            logger.warn(`${username} - Missing required headers: ${missingHeaders.join(', ')}`);
            return res.status(400).send(`Missing required headers: ${missingHeaders.join(', ')}`);
        }

        const indexes = {
            date: headers.indexOf('date_'),
            auditDate: headers.indexOf('audit_date'),
            campaignId: headers.indexOf('campaign_id'),
            client: headers.indexOf('client'),
            campaignName: headers.indexOf('campaign_name'),
            companyName: headers.indexOf('company_name'),
            firstName: headers.indexOf('first_name'),
            lastName: headers.indexOf('last_name'),
            email: headers.indexOf('email'),
            qaName: headers.indexOf('qa_name'),
            linkedinLink: headers.indexOf('linkedin_link'),
            endClientName: headers.indexOf('end_client_name'),
            left3: headers.indexOf('left_3'),
            left4: headers.indexOf('left_4')
        };

        const parseDate = (dateValue) => {
            if (dateValue === '-') {
                return '-';
            } else if (dateValue instanceof Date) {
                return format(dateValue, 'dd-MMM-yy');
            } else if (typeof dateValue === 'string') {
                const parsedDate = parse(dateValue, 'dd-MMM-yy', new Date());
                if (!isValid(parsedDate)) {
                    logger.error(`${username} - Invalid date format at row: ${dateValue}`);
                    throw new Error(`Invalid date format: ${dateValue}`);
                }
                return format(parsedDate, 'dd-MMM-yy');
            } else if (typeof dateValue === 'number') {
                const excelEpoch = new Date(0, 0, dateValue - (25567 + 1)); // Excel date conversion
                return format(excelEpoch, 'dd-MMM-yy');
            } else {
                throw new Error(`Unexpected dateValue type: ${typeof dateValue}. Uploaded date: ${dateValue}`);
            }
        };

        await Promise.all(dataRows.map(async (row, index) => {
            const rowData = {
                date: parseDate(row[indexes.date]),
                auditDate: parseDate(row[indexes.auditDate]),
                campaignId: row[indexes.campaignId],
                client: row[indexes.client],
                campaignName: row[indexes.campaignName],
                companyName: row[indexes.companyName],
                firstName: row[indexes.firstName],
                lastName: row[indexes.lastName],
                email: row[indexes.email],
                qaName: row[indexes.qaName],
                linkedinLink: row[indexes.linkedinLink],
                endClientName: row[indexes.endClientName],
                left3: row[indexes.left3],
                left4: row[indexes.left4]
            };
            return insertSuppressionData(rowData, index, username);
        }));

        res.send('Processed successfully. Check server logs for results.');
    } catch (err) {
        logger.error(`${username} - Error processing file: ${err.message}`);
        res.status(500).send('Failed to process file.');
    }
}

module.exports = {
    processExcel,
    insertSuppressionData
};
