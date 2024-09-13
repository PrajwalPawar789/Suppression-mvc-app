import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ClientWiseChart from './ClientWiseChart';
import SpocWiseChart from './SpocWiseChart';
import { CSVLink } from 'react-csv';
import { PDFDownloadLink, Document, Page, Text, View } from '@react-pdf/renderer';
import DispositionWiseChart from './DispositionWiseChart'; // Import the new chart component

// Example PDF document component
const MyDocument = ({ data }) => (
  <Document>
    <Page size="A4">
      <View>
        <Text>Total Leads: {data.totalLeads}</Text>
        {/* Add more details as needed */}
      </View>
    </Page>
  </Document>
);

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ startDate: '', endDate: '' });

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:3000/report');
      if (Array.isArray(response.data)) {
        const formattedData = response.data.map(item => ({
          ...item,
          total_records: parseInt(item.total_records, 10),
        }));
        setData(formattedData);
      } else {
        setError('Unexpected data format received from server.');
      }
    } catch (err) {
      setError('Failed to load report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  const totalLeads = data.reduce((acc, curr) => acc + curr.total_records, 0);

  const getCounts = (key) => {
    return data.reduce((acc, curr) => {
      acc[curr[key]] = (acc[curr[key]] || 0) + curr.total_records;
      return acc;
    }, {});
  };

  const clientWise = getCounts('client');
  const spocWise = getCounts('delivery_spoc');
  const campaignWise = getCounts('campaign_name');
  const spocCampaignWise = data.reduce((acc, curr) => {
    const key = `${curr.delivery_spoc} - ${curr.campaign_name}`;
    acc[key] = (acc[key] || 0) + curr.total_records;
    return acc;
  }, {});
  const dispositionWise = getCounts('call_disposition');

  // Handle filter logic
  const filteredData = data.filter(item => {
    const date = new Date(item.date_);
    const startDate = new Date(filter.startDate);
    const endDate = new Date(filter.endDate);
    return (!filter.startDate || date >= startDate) &&
           (!filter.endDate || date <= endDate);
  });

  const totalFilteredLeads = filteredData.reduce((acc, curr) => acc + curr.total_records, 0);

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <h1 className="text-4xl font-extrabold text-white mb-8 animate-fadeIn">
        <span className="text-indigo-500">Dashboard</span>
      </h1>

      <div className="mb-6 flex items-center gap-4">
        <input
          type="date"
          className="p-2 rounded bg-gray-800 text-white"
          value={filter.startDate}
          onChange={(e) => setFilter(prev => ({ ...prev, startDate: e.target.value }))}
        />
        <input
          type="date"
          className="p-2 rounded bg-gray-800 text-white"
          value={filter.endDate}
          onChange={(e) => setFilter(prev => ({ ...prev, endDate: e.target.value }))}
        />
        <button
          className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
          onClick={() => fetchData()}
        >
          Apply Filter
        </button>
      </div>

      <div className="mb-6 flex gap-4">
        <CSVLink
          data={data}
          filename={"dashboard-data.csv"}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Export to CSV
        </CSVLink>
        <PDFDownloadLink
          document={<MyDocument data={{ totalLeads: totalFilteredLeads }} />}
          fileName="dashboard-data.pdf"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {({ loading }) => (loading ? 'Loading document...' : 'Export to PDF')}
        </PDFDownloadLink>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg  rounded-lg p-8">
          <h2 className="text-xl font-semibold text-white mb-4">Total Leads Suppressed</h2>
          <p className="text-4xl font-bold text-white">{totalFilteredLeads}</p>
        </div>

        <div className="bg-gray-800 shadow-lg rounded-lg p-8 transform transition hover:scale-105 duration-300">
          <h2 className="text-xl font-semibold text-white mb-4">Leads Suppressed Client Wise</h2>
          <ClientWiseChart data={clientWise} />
        </div>

        <div className="bg-gray-800 shadow-lg rounded-lg p-8 transform transition hover:scale-105 duration-300">
          <h2 className="text-xl font-semibold text-white mb-4">Leads Suppressed Delivery SPoC Wise</h2>
          <SpocWiseChart data={spocWise} />
        </div>

        <div className="bg-gray-800 shadow-lg rounded-lg p-8 transform transition hover:scale-105 duration-300">
          <h2 className="text-xl font-semibold text-white mb-4">Leads by Call Disposition</h2>
          <DispositionWiseChart data={dispositionWise} />
        </div>

        <div className="bg-gray-800 shadow-lg rounded-lg p-8 transform transition hover:scale-105 duration-300 max-h-80 overflow-y-auto">
  <h2 className="text-xl font-semibold text-white mb-4">Leads Suppressed Campaign Name Wise</h2>
  <ul className="text-white">
    {Object.entries(campaignWise).map(([campaign, count]) => (
      <li key={campaign} className="flex justify-between mb-2">
        <span>{campaign}</span>
        <span>{count}</span>
      </li>
    ))}
  </ul>
</div>

<div className="bg-gray-800 shadow-lg rounded-lg p-8 transform transition hover:scale-105 duration-300 max-h-60 overflow-y-auto">
  <h2 className="text-xl font-semibold text-white mb-4">SPoC for Each Campaign</h2>
  <ul className="text-white">
    {Object.entries(spocCampaignWise).map(([key, count]) => (
      <li key={key} className="flex justify-between mb-2">
        <span>{key}</span>
        <span>{count}</span>
      </li>
    ))}
  </ul>
</div>

        
      </div>
    </div>
  );
};

export default Dashboard;
