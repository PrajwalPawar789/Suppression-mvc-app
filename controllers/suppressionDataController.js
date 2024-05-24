const { Pool } = require('pg');
const readXlsxFile = require('read-excel-file/node');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'supppression-db',
    password: 'root',
    port: 5432
  });

async function insertSuppressionData(req, res) {
    const { left3, left4, clientCode, date } = req.body;
    const client = await pool.connect();
    try {
        const query = `
            INSERT INTO campaigns (left_3, left_4, client, date_)
            VALUES ($1, $2, $3, $4);`;
        await client.query(query, [left3, left4, clientCode, date]);
        res.send("Data inserted successfully.");
    } catch (err) {
        console.error("Error inserting data:", err);
        res.status(500).send("Failed to insert data.");
    } finally {
        client.release();
    }
}

async function processExcel(req, res) {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const { dateCheck } = req.body;
    const path = req.file.path;
    try {
        const rows = await readXlsxFile(path);
        console.log(`Total rows (including header): ${rows.length}`);

        // Get header and data rows
        const headers = rows[0];
        const dataRows = rows.slice(1);
        console.log(`Processing ${dataRows.length} rows of data.`);

        // Get the index of each column from the headers
        const indexes = {
            date: headers.indexOf('Date_'),
            month: headers.indexOf('Month_'),
            campaignId: headers.indexOf('Campaign_ID'),
            client: headers.indexOf('Client'),
            endClientName: headers.indexOf('End_Client_Name'),
            campaignName: headers.indexOf('Campaign_Name'),
            firstName: headers.indexOf('first_name'),
            lastName: headers.indexOf('last_name'),
            companyName: headers.indexOf('company_name'),
            country: headers.indexOf('country'),
            phone: headers.indexOf('phone'),
            email: headers.indexOf('email'),
            deliverySpoc: headers.indexOf('Delivery_Spoc'),
            left3: headers.indexOf('Left_3'),
            left4: headers.indexOf('Left_4'),
            callDisposition: headers.indexOf('Call Disposition'),
            bclOpsTlName: headers.indexOf('BCL/Ops TL Name'),
            category: headers.indexOf('Catagory')
        };

        const results = await Promise.all(dataRows.map(async (row, index) => {
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
                deliverySpoc: row[indexes.deliverySpoc],
                left3: row[indexes.left3],
                left4: row[indexes.left4],
                callDisposition: row[indexes.callDisposition],
                bclOpsTlName: row[indexes.bclOpsTlName],
                category: row[indexes.category]
            };

            const client = await pool.connect();
            try {
                const query = 'SELECT * FROM campaigns WHERE left_3 = $1 AND left_4 = $2 AND client = $3';
                const result = await client.query(query, [rowData.left3, rowData.left4, rowData.client]);
                if (result.rows.length > 0) {
                    const dbDate = new Date(result.rows[0].date_);
                    const excelDate = new Date(rowData.date);
                    const ageDifferenceInMonths = Math.abs(calculateAgeDifferenceInMonths(dbDate, excelDate));

                    if ((dateCheck === '6months' && ageDifferenceInMonths >= 6) || (dateCheck === '1year' && ageDifferenceInMonths >= 12)) {
                        const updateQuery = 'UPDATE campaigns SET date_ = $1 WHERE left_3 = $2 AND left_4 = $3 AND client = $4';
                        await client.query(updateQuery, [new Date(), rowData.left3, rowData.left4, rowData.client]);
                        console.log(`Updated record for row ${index + 1}: left3: ${rowData.left3}, left4: ${rowData.left4}, client: ${rowData.client}`);
                        return 'exceeds';
                    } else {
                        return 'match';
                    }
                } else {
                    const insertQuery = `
                        INSERT INTO campaigns (date_, month_, campaign_id, client, end_client_name, campaign_name, first_name, last_name, company_name, country, phone, email, delivery_spoc, left_3, left_4, call_disposition, bcl_ops_tl_name, category)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`;
                    await client.query(insertQuery, [
                        rowData.date, rowData.month, rowData.campaignId, rowData.client, rowData.endClientName, rowData.campaignName,
                        rowData.firstName, rowData.lastName, rowData.companyName, rowData.country, rowData.phone, rowData.email,
                        rowData.deliverySpoc, rowData.left3, rowData.left4, rowData.callDisposition, rowData.bclOpsTlName, rowData.category
                    ]);
                    console.log(`Inserted new record for row ${index + 1}: left3: ${rowData.left3}, left4: ${rowData.left4}, client: ${rowData.client}`);
                    return 'unmatch';
                }
            } catch (error) {
                console.error(`Error processing row ${index + 1}:`, error);
                return 'error';
            } finally {
                client.release();
            }
        }));

        const finalResults = results.join(',');
        console.log(`Final results: ${finalResults}`);
        res.send('Processed successfully. Check server logs for results.');
    } catch (err) {
        console.error('Error processing file:', err);
        res.status(500).send('Failed to process file.');
    }
}

function calculateAgeDifferenceInMonths(date1, date2) {
    const yearsDiff = date2.getFullYear() - date1.getFullYear();
    const monthsDiff = date2.getMonth() - date1.getMonth();
    const totalMonthsDiff = (yearsDiff * 12) + monthsDiff + (date2.getDate() >= date1.getDate() ? 0 : -1);
    return totalMonthsDiff;
}

module.exports = {
    insertSuppressionData,
    processExcel
};
