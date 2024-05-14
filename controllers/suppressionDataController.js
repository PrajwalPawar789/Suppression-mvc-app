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

    const path = req.file.path;
    try {
        const rows = await readXlsxFile(path);
        // Assuming the first row is headers and actual data starts from the second row
        const results = rows.slice(1).map(async ([left3, left4]) => {
            const client = await pool.connect();
            try {
                const { rows } = await client.query('SELECT * FROM campaigns WHERE left_3 = $1 AND left_4 = $2', [left3, left4]);
                return rows.length > 0 ? 'match' : 'unmatch';
            } finally {
                client.release();
            }
        });

        Promise.all(results).then(results => {
            console.log(results);
            res.send('Processed successfully. Check server logs for results.');
        });
    } catch (err) {
        console.error('Error processing file:', err);
        res.status(500).send('Failed to process file.');
    }
}

module.exports = {
    insertSuppressionData,
    processExcel
};
