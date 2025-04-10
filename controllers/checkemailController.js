const { Pool } = require('pg');
const logger = require('./logger'); // Ensure you have a logger module

// const pool = new Pool({
//     user: "postgres",
//     host: "158.220.121.203",
//     database: "postgres",
//     password: "P0stgr3s%098",
//     port: 5432,
//   });

  const pool = new Pool({
    user: "root",
    host: "192.168.1.36",
    database: "suppression",
    password: "Scitilnam$007",
    port: 5432,
  });

async function checkDatabase(firstName, lastName, email, clientCode, companyName, linkedinLink, username, dateFilter) {
    const calculatedLeft3 = `${firstName.substring(0, 3)}${lastName.substring(0, 3)}${companyName.substring(0, 3)}`;
    const calculatedLeft4 = `${firstName.substring(0, 4)}${lastName.substring(0, 4)}${companyName.substring(0, 4)}`;

    logger.info(`${username} - Checking database for: email=${email}, clientCode=${clientCode}, companyName=${companyName}, linkedinLink=${linkedinLink}`);
    logger.info(`${username} - Calculated left_3: ${calculatedLeft3}, left_4: ${calculatedLeft4}`);

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        logger.info(`${username} - Database transaction started.`);

        const monthsInterval = parseInt(dateFilter) || 0; // Use 0 if not selected
        const selectQuery = `
            WITH data AS (
        SELECT $1 AS linkedin_link,
               $2 AS client_code,
               $3 AS left_3,
               $4 AS left_4,
               $5 AS email_id
    ),
    email_statuses AS (
        SELECT
            (SELECT CASE WHEN EXISTS (
                SELECT 1 FROM public.global_email_suppression WHERE email_address = $5
            ) THEN 'Match' ELSE 'Unmatch' END) AS global_email_status,
            (SELECT CASE WHEN EXISTS (
                SELECT 1 FROM public.invalid_email_addresses WHERE email_address = $5
            ) THEN 'Match' ELSE 'Unmatch' END) AS invalid_email_status
    ),
    filtered_campaigns AS (
        SELECT
            CASE
                WHEN (current_date - to_date(c.date_, 'DD-Mon-YY'))::int > ($6 * 30) THEN 'Suppression Cleared'
                ELSE 'Still Suppressed'
            END AS date_status,
            CASE
                WHEN c.left_3 = d.left_3 AND c.left_4 = d.left_4 THEN 'Match'
                ELSE 'Unmatch'
            END AS match_status,
            CASE
                WHEN c.email = d.email_id THEN 'Match'
                ELSE 'Unmatch (' || c.email || ')'
            END AS email_status,
            CASE
                WHEN c.client = d.client_code THEN 'Match (' || c.client || ')'
                ELSE 'Unmatch'
            END AS client_code_status,
            CASE
                WHEN c.linkedin_link = d.linkedin_link THEN 'Match'
                ELSE 'Unmatch (' || c.linkedin_link || ')'
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
            AND NOT (c.client = 'DI31' AND c.end_client_name IN ('OtherCondition'))
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
        (SELECT global_email_status FROM email_statuses) AS global_email_status,
        (SELECT invalid_email_status FROM email_statuses) AS invalid_email_status
    FROM (
        SELECT * FROM final_result
        UNION ALL
        SELECT 'Fresh Lead GTG' AS date_status, 'Unmatch' AS match_status, 'Unmatch' AS email_status, 'Unmatch' AS client_code_status, 'Unmatch' AS linkedin_link_status
        WHERE NOT EXISTS (SELECT 1 FROM final_result)
    ) AS subquery
    LIMIT 1;
        `;

        logger.info(`${username} - Executing SELECT query with params: ${[linkedinLink, clientCode, calculatedLeft3, calculatedLeft4, email, monthsInterval]}`);
        const result = await client.query(selectQuery, [linkedinLink, clientCode, calculatedLeft3, calculatedLeft4, email, monthsInterval]);

        if (result.rows.length === 0) {
            logger.info(`${username} - No match found, inserting fresh lead.`);
            
            const insertQuery = `
            INSERT INTO public.campaigns (linkedin_link, client, left_3, left_4, email)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT DO NOTHING;`;
            
            await client.query(insertQuery, [linkedinLink, clientCode, calculatedLeft3, calculatedLeft4, email]);
            logger.info(`${username} - Fresh lead inserted.`);
        } else {
            logger.info(`${username} - Query result: ${JSON.stringify(result.rows[0])}`);
        }

        await client.query('COMMIT');
        logger.info(`${username} - Transaction committed.`);
        return result.rows.length ? result.rows[0] : { message: "Fresh lead inserted." }; 
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`${username} - Database query error: ${error.message}`);
        return { message: "An error occurred while checking the database." };
    } finally {
        client.release();
        logger.info(`${username} - Database connection released.`);
    }
}


async function checkEmail(req, res) {
    const username = req.session.username || 'Anonymous'; // Fallback if username is not set
    logger.info(`${username} - Check email request received.`);

    const { email, clientCode, firstName, lastName, companyName, linkedin, dateFilter } = req.body;
    logger.info(`${username} - Checking email: ${email}, clientCode: ${clientCode}, companyName: ${companyName}, linkedinLink: ${linkedin}, dateFilter: ${dateFilter}`);

    const linkedinLink = linkedin;
    const result = await checkDatabase(firstName, lastName, email, clientCode, companyName, linkedinLink, username, dateFilter);

    logger.info(`${username} - Check email result: ${JSON.stringify(result)}`);
    res.render('checkemailresult', { result }); // Pass the result directly
}

module.exports = {
    checkEmail
};
