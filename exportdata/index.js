const express = require('express');
const { Pool } = require('pg');
const ExcelJS = require('exceljs');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3051;

// PostgreSQL pool configuration
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'supppression-db',
    password: 'root',
    port: 5432,
});

// Middleware
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Route to render the input form
app.get('/', (req, res) => {
    res.render('index');
});

// Function to export data to Excel by client code
async function exportDataToExcel(clientCode) {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Campaigns');

        // Add header row with only Campaign ID and Email
        worksheet.columns = [
            { header: 'Date', key: 'date_' },
            { header: 'Campaign ID', key: 'campaign_id' },
            { header: 'Email', key: 'email' }
        ];

        const outputDir = path.join(__dirname, 'public');
        const outputPath = path.join(outputDir, `campaigns_${clientCode}.xlsx`);

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }

        // Stream data from the database with selected columns
        let offset = 0;
        const limit = 10000; // Number of records per page
        let totalRecords;

        do {
            const query = 'SELECT date_, campaign_id, email FROM public.campaigns WHERE client = $1 LIMIT $2 OFFSET $3';
            const result = await pool.query(query, [clientCode, limit, offset]);
            totalRecords = result.rows.length;

            // Add rows to the worksheet
            for (const row of result.rows) {
                worksheet.addRow(row);
            }

            offset += limit;
        } while (totalRecords === limit);

        await workbook.xlsx.writeFile(outputPath);
        return outputPath;
    } catch (error) {
        console.error('Error exporting data to Excel:', error);
        return null;
    }
}

// Route to handle form submission and export
app.post('/export', async (req, res) => {
    const clientCode = req.body.clientCode;
    const filePath = await exportDataToExcel(clientCode);

    if (filePath) {
        res.download(filePath, (err) => {
            if (err) {
                console.error('Error downloading the file:', err);
            }
        });
    } else {
        res.send(`No data found for client code: ${clientCode}`);
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
