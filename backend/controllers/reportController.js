const { Pool } = require('pg');

// Initialize the PostgreSQL connection pool
// const pool = new Pool({
//   user: "postgres",
//   host: "158.220.121.203",
//   database: "postgres",
//   password: "P0stgr3s%098",
//   port: 5432,
// });
const pool = new Pool({
  user: "root",
  host: "192.168.1.36",
  database: "suppression",
  password: "Scitilnam$007",
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

  const diffDays = parseInt(req.query.diffDays, 10) || 0; // Ensure it's an integer
  console.log(`Received diffDays: ${diffDays}`);

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
      TO_DATE(date_, 'DD-Mon-YY') = CURRENT_DATE - INTERVAL '${diffDays} days'
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
      bcl_ops_tl_name ASC;
  `;

  console.log("Given query for fetching report data:", query);

  try {
    await testConnection();
    const result = await pool.query(query);
    console.log('Query Result:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Error executing query:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


const getLeadDataForDay = async (req, res) => {
  console.log("Inside the getLeadDataForDay function");

  const diffDays = parseInt(req.query.diffDays, 10) || 0; // Ensure it's an integer
  console.log(`Received diffDays: ${diffDays}`);

  const query = `
    SELECT *
    FROM public.campaigns
    WHERE date_::DATE = CURRENT_DATE - INTERVAL '${diffDays} days';
  `;

  console.log("Given query for downloading the data", query);

  try {
    await testConnection();
    const result = await pool.query(query);
    console.log('Query Result:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Error executing query:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getQQLeadDataForDay = async (req, res) => {
  console.log("Inside the getQQDataForDay function");

  const diffDays = parseInt(req.query.diffDays, 10) || 0; // Ensure it's an integer
  console.log(`Received diffDays: ${diffDays}`);

  const query = `
    SELECT *
    FROM public.quality_qualified
    WHERE audit_date::DATE = CURRENT_DATE - INTERVAL '${diffDays} days';
  `;

  console.log("Given query for downloading the data", query);

  try {
    await testConnection();
    const result = await pool.query(query);
    console.log('Query Result:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Error executing query:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getQQReportData = async (req, res) => {
  console.log("Inside the getQQReportData function");

  const diffDays = parseInt(req.query.diffDays, 10) || 0; // Ensure it's an integer
  console.log(`Received diffDays: ${diffDays}`);

  const query = `
    SELECT  
      audit_date as date_, 
      client, 
      qa_name, 
      campaign_id, 
      end_client_name, 
      COUNT(*) AS total_records
    FROM 
      public.quality_qualified
    WHERE
      TO_DATE(audit_date, 'DD-Mon-YY') = CURRENT_DATE - INTERVAL '${diffDays} days'
    GROUP BY 
      audit_date, 
      client, 
      qa_name, 
      campaign_id, 
      end_client_name
    
    ORDER BY 
      audit_date ASC, 
      client ASC, 
      qa_name ASC, 
      campaign_id ASC, 
      end_client_name ASC
  `;

  console.log("Given query for fetching QQ report data:", query);

  try {
    await testConnection();
    const result = await pool.query(query);
    console.log('Query Result:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Error executing query:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};




module.exports = { getReportData, getLeadDataForDay, getQQLeadDataForDay , getQQReportData};