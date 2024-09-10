const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'supppression-db',
  password: 'root',
  port: 5432
});

// Function to format date as 'DD-Mon-YY'
const formatDate = (date) => {
  const options = { day: '2-digit', month: 'short', year: '2-digit' };
  const formattedDate = new Date(date).toLocaleDateString('en-GB', options).replace(/ /g, '-');
  return formattedDate;
};

const datafordashboard = async (req, res) => {
  const { start_date, end_date } = req.body;
  console.log(`Start Date values: ${start_date} and End Date Value ${end_date}`);

  if (!start_date || !end_date) {
    return res.status(400).send('Start date and end date are required');
  }

  try {
    // Format the dates to 'DD-Mon-YY'
    const formattedStartDate = formatDate(start_date);
    const formattedEndDate = formatDate(end_date);

    console.log(`Formatted Start Date: '${formattedStartDate}' and Formatted End Date: '${formattedEndDate}'`);

    // Verify the query is constructed correctly
    const query = `
      SELECT 
          date_,
          client, 
          delivery_spoc, 
          country, 
          campaign_name, 
          end_client_name,
          call_disposition,
          COUNT(*) AS total_records
      FROM 
          public.campaigns
      WHERE
          TO_DATE(date_, 'DD-Mon-YY') BETWEEN TO_DATE('01-Jun-24', 'DD-Mon-YY') AND TO_DATE('07-Jun-24', 'DD-Mon-YY')
      GROUP BY 
          date_,
          client, 
          delivery_spoc, 
          country, 
          campaign_name,
          end_client_name,
          call_disposition
      ORDER BY 
          date_ ASC, client ASC, delivery_spoc ASC, country ASC, campaign_name ASC, end_client_name ASC, call_disposition ASC;
    `;

    console.log(`Executing query with values: [${formattedStartDate}, ${formattedEndDate}]`);

    const result = await pool.query(query);

    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.send('No data available for the specified date range');
    }
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = { datafordashboard };
