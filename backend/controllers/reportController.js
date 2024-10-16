const { Pool } = require('pg');

// Initialize the PostgreSQL connection pool
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "supppression-db",
  password: "root",
  port: 5432,
});

// Function to test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Database connection successful');
    client.release();
  } catch (err) {
    console.error('Database connection error:', err.message);
  }
};

// Function to get the report data
const getReportData = async (req, res) => {
  console.log("Inside the getReportData function");

  // Get diffDays from query parameters
  const diffDays = (req.query.diffDays || 0); // Default to 0 if not provided
  console.log(`Received diffDays: ${diffDays}`);

  const interval1 = `${diffDays} days`; // Use diffDays in your SQL query

  const query = `
    SELECT  
      date_,
      client, 
      delivery_spoc, 
      country, 
      campaign_id, 
      end_client_name,
      call_disposition,
      bcl_ops_tl_name,
      COUNT(*) AS total_records
    FROM 
      public.campaigns
    WHERE
      date_ ~ $1 AND
      TO_DATE(date_, 'DD-Mon-YY') = CURRENT_DATE - INTERVAL '${interval1}'
    GROUP BY 
      date_,
      client, 
      delivery_spoc, 
      country, 
      campaign_id,
      end_client_name,
      call_disposition,
      bcl_ops_tl_name
    ORDER BY 
      date_ ASC, 
      client ASC, 
      delivery_spoc ASC, 
      country ASC, 
      campaign_id ASC, 
      end_client_name ASC, 
      call_disposition ASC,
      bcl_ops_tl_name ASC;`;

  const values = ['^\\d{2}-[A-Za-z]{3}-\\d{2}$'];

  try {
    await testConnection();
    const result = await pool.query(query, values);
    console.log('Query Result:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Error executing query:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


// const getReportData = async (req, res) => {
//   console.log("Inside the getReportData function");

//   const date = 4;

//   const interval1 = `${date} days`; 

//   const query = `
//   SELECT  
//     date_,
//     client, 
//     delivery_spoc, 
//     country, 
//     campaign_id, 
//     end_client_name,
//     call_disposition,
//     bcl_ops_tl_name,
//     COUNT(*) AS total_records
//   FROM 
//     public.campaigns
//   WHERE
//     date_ ~ $1 AND
//     TO_DATE(date_, 'DD-Mon-YY') = CURRENT_DATE - INTERVAL '${interval1}'
//   GROUP BY 
//     date_,
//     client, 
//     delivery_spoc, 
//     country, 
//     campaign_id,
//     end_client_name,
//     call_disposition,
//     bcl_ops_tl_name
//   ORDER BY 
//     date_ ASC, 
//     client ASC, 
//     delivery_spoc ASC, 
//     country ASC, 
//     campaign_id ASC, 
//     end_client_name ASC, 
//     call_disposition ASC,
//     bcl_ops_tl_name ASC;
// `;

//   // Regular expression for date format validation
//   const values = ['^\\d{2}-[A-Za-z]{3}-\\d{2}$'];

//   try {
//     // Test database connection (optional, can be removed if connection is stable)
//     await testConnection();

//     // Execute the query
//     const result = await pool.query(query, values);

//     console.log('Query Result:', result.rows); // Log the result for debugging

//     // Send the result as JSON
//     res.json(result.rows);
//   } catch (error) {
//     console.error('Error executing query:', error.message); // Log the error message for debugging
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

module.exports = { getReportData };