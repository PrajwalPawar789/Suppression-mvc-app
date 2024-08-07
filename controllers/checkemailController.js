const { Pool } = require('pg');
const logger = require('./logger'); // Add this line

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'supppression-db',
    password: 'root',
    port: 5432
});

async function checkDatabase(firstName, lastName, email, clientCode, companyName, linkedinLink) {
    const calculatedLeft3 = `${firstName.substring(0, 3)}${lastName.substring(0, 3)}${companyName.substring(0, 3)}`;
    const calculatedLeft4 = `${firstName.substring(0, 4)}${lastName.substring(0, 4)}${companyName.substring(0, 4)}`;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        logger.info('Database connection established.');

        const query = `
WITH data AS (
    SELECT $1 AS linkedin_link,
           $2 AS client_code,
           $3 AS left_3,
           $4 AS left_4,
           $5 AS email_id
)
SELECT
    CASE
        WHEN c.left_3 = d.left_3 AND c.left_4 = d.left_4 THEN 'Match'
        ELSE 'Unmatch'
    END AS match_status,
    CASE
        WHEN c.email = d.email_id THEN 'Match'
        ELSE 'unmatch'
    END AS email_status,
    CASE
        WHEN c.client = d.client_code THEN 'Match'
        ELSE 'Unmatch'
    END AS client_code_status,
    CASE
        WHEN c.linkedin_link = d.linkedin_link THEN 'Match'
        ELSE 'unmatch'
    END AS linkedin_link_status,
    CASE
        WHEN c.client IS NULL AND c.linkedin_link IS NULL THEN 'Data not found in suppression'
        ELSE 'Data found in suppression'
    END AS data_found_status
FROM
    data d
LEFT JOIN
    public.campaigns c ON ((c.client = d.client_code AND c.linkedin_link = d.linkedin_link)
                          OR (c.left_3 = d.left_3 AND c.left_4 = d.left_4)
                          OR c.email = d.email_id)
                          AND NOT (c.client = 'TE16' AND c.end_client_name IN ('MSFT', 'Microsoft'));

`;

        const result = await client.query(query, [linkedinLink, clientCode, calculatedLeft3, calculatedLeft4, email]);

        const { data_found_status } = result.rows[0];

        if (data_found_status === 'Data not found in suppression') {
            const existingDataQuery = `
                SELECT 1 FROM suppression_data 
                WHERE first_name = $1 
                AND last_name = $2 
                AND company_name = $3 
                AND email = $4 
                AND client_code = $5 
                AND linkedin_link = $6;
            `;
            const existingData = await client.query(existingDataQuery, [firstName, lastName, companyName, email, clientCode, linkedinLink]);

            if (existingData.rows.length === 0) {
                const insertQuery = `
                    INSERT INTO suppression_data (first_name, last_name, company_name, email, client_code, linkedin_link, status)
                    VALUES ($1, $2, $3, $4, $5, $6, $7);
                `;
                await client.query(insertQuery, [firstName, lastName, companyName, email, clientCode, linkedinLink, data_found_status]);
                logger.info(`Inserted data into suppression_data: ${firstName}, ${lastName}, ${companyName}, ${email}, ${clientCode}, ${linkedinLink}, ${data_found_status}`);
            } else {
                logger.info('Data already exists in suppression_data.');
            }
        }

        await client.query('COMMIT');
        logger.info('Transaction committed.');
        return result.rows;
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Database query error:', error);
        return [];
    } finally {
        client.release();
        logger.info('Database connection released.');
    }
}

async function checkEmail(req, res) {
    logger.info(`Username ${req.session.username} from checkemail`);
    const { email, clientCode, firstName, lastName, companyName, linkedin } = req.body;
    logger.info(`Checking email: ${email} for client code: ${clientCode}`);

    const linkedinLink = linkedin;

    const result = await checkDatabase(firstName, lastName, email, clientCode, companyName, linkedinLink);
    logger.info(`Result: ${JSON.stringify(result)}`);
    res.render('checkemailresult', { result });
}

module.exports = {
    checkEmail
};
