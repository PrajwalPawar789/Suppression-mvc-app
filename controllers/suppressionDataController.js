const { Pool } = require('pg');
const readXlsxFile = require('read-excel-file/node');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'supppression-db',
    password: 'root',
    port: 5432
});


async function insertSuppressionData(rowData, index) {
    const client = await pool.connect();
    try {
        const checkQuery = `
            SELECT 1 FROM campaigns 
            WHERE client = $1 AND campaign_id = $2 AND end_client_name = $3 
            AND left_3 = $4 AND left_4 = $5 AND linkedin_link = $6;
        `;
        const checkResult = await client.query(checkQuery, [
            rowData.client, rowData.campaignId, rowData.endClientName, 
            rowData.left3, rowData.left4, rowData.linkedinLink
        ]);

        if (checkResult.rows.length === 0) {
            const insertQuery = `
                INSERT INTO campaigns (
                    date_, month_, campaign_id, client, end_client_name, campaign_name,
                    first_name, last_name, company_name, country, phone, email,
                    linkedin_link, job_title, employee_size, asset, delivery_spoc,
                    left_3, left_4, call_disposition, bcl_ops_tl_name, response_date
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
                    $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
                );
            `;
            await client.query(insertQuery, [
                rowData.date, rowData.month, rowData.campaignId, rowData.client, rowData.endClientName, rowData.campaignName,
                rowData.firstName, rowData.lastName, rowData.companyName, rowData.country, rowData.phone, rowData.email,
                rowData.linkedinLink, rowData.jobTitle, rowData.employeeSize, rowData.asset, rowData.deliverySpoc,
                rowData.left3, rowData.left4, rowData.callDisposition, rowData.bclOpsTlName, rowData.responseDate
            ]);
            console.log(`Inserted new record for row ${index + 1}: left3: ${rowData.left3}, left4: ${rowData.left4}, client: ${rowData.client}`);
        } else {
            console.log(`Duplicate record found for row ${index + 1}: left3: ${rowData.left3}, left4: ${rowData.left4}, client: ${rowData.client}`);
        }
    } catch (error) {
        console.error(`Error processing row ${index + 1}:`, error);
    } finally {
        client.release();
    }
}

async function processExcel(req, res) {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const path = req.file.path;
    try {
        const rows = await readXlsxFile(path);
        console.log(`Total rows (including header): ${rows.length}`);
 
        const headers = rows[0];
        const dataRows = rows.slice(1);
        console.log(`Processing ${dataRows.length} rows of data.`);

        const indexes = {
            date: headers.indexOf('date_'),
            month: headers.indexOf('month_'),
            campaignId: headers.indexOf('campaign_id'),
            client: headers.indexOf('client'),
            endClientName: headers.indexOf('end_client_name'),
            campaignName: headers.indexOf('campaign_name'),
            firstName: headers.indexOf('first_name'),
            lastName: headers.indexOf('last_name'),
            companyName: headers.indexOf('company_name'),
            country: headers.indexOf('country'),
            phone: headers.indexOf('phone'),
            email: headers.indexOf('email'),
            linkedinLink: headers.indexOf('linkedin_link'),
            jobTitle: headers.indexOf('job_title'),
            employeeSize: headers.indexOf('employee_size'),
            asset: headers.indexOf('asset'),
            deliverySpoc: headers.indexOf('delivery_spoc'),
            left3: headers.indexOf('left_3'),
            left4: headers.indexOf('left_4'),
            callDisposition: headers.indexOf('call_disposition'),
            bclOpsTlName: headers.indexOf('bcl_ops_tl_name'),
            responseDate: headers.indexOf('response_date')
        };

        await Promise.all(dataRows.map(async (row, index) => {
            const rowData = {
                date: row[indexes.date],
                month: row[indexes.month],
                campaignId: row[indexes.campaignId],
                client: row[indexes.client],
                endClientName: row[indexes.endClientName],
                campaignName: row[indexes.campaignName],
                firstName: row[indexes.firstName],
                lastName: row[indexes.lastName],
                companyName: row[indexes.companyName],
                country: row[indexes.country],
                phone: row[indexes.phone],
                email: row[indexes.email],
                linkedinLink: row[indexes.linkedinLink],
                jobTitle: row[indexes.jobTitle],
                employeeSize: row[indexes.employeeSize],
                asset: row[indexes.asset],
                deliverySpoc: row[indexes.deliverySpoc],
                left3: row[indexes.left3],
                left4: row[indexes.left4],
                callDisposition: row[indexes.callDisposition],
                bclOpsTlName: row[indexes.bclOpsTlName],
                responseDate: row[indexes.responseDate]
            };
            return insertSuppressionData(rowData, index);
        }));

        res.send('Processed successfully. Check server logs for results.');
    } catch (err) {
        console.error('Error processing file:', err);
        res.status(500).send('Failed to process file.');
    }
}


module.exports = {
    processExcel,
    insertSuppressionData
};
