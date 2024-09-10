import React, { useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const EMICalculator = () => {
  const [principal, setPrincipal] = useState('');
  const [annualRate, setAnnualRate] = useState('');
  const [tenure, setTenure] = useState('');
  const [emi, setEmi] = useState(null);
  const [error, setError] = useState('');

  const calculateEMI = () => {
    const P = parseFloat(principal);
    const R = parseFloat(annualRate) / 12 / 100; // Convert annual rate to monthly and in decimal
    const N = parseFloat(tenure) * 12; // Convert years to months

    if (P > 0 && R > 0 && N > 0) {
      const emiCalc = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
      setEmi(emiCalc.toFixed(2)); // Set EMI result and round to 2 decimals
      setError('');
    } else {
      setEmi(null);
      setError('Please enter valid values for all fields.');
    }
  };

  // Pie chart data
  const pieChartData = {
    labels: ['Principal Amount', 'Interest Amount', 'EMI'],
    datasets: [
      {
        data: [
          parseFloat(principal || 0),
          parseFloat(emi || 0) * 12 - parseFloat(principal || 0),
          parseFloat(emi || 0) * 12
        ],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg grid grid-cols-1 md:grid-cols-2 gap-10">
      {/* EMI Calculator Section */}
      <div>
        <h2 className="text-2xl font-bold text-center mb-6">EMI Calculator</h2>

        <div className="mb-4">
          <label className="block text-gray-700">Principal Loan Amount (₹):</label>
          <input
            type="number"
            min="0"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter principal amount"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Annual Interest Rate (%):</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={annualRate}
            onChange={(e) => setAnnualRate(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter annual interest rate"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Loan Tenure (years):</label>
          <input
            type="number"
            min="0"
            value={tenure}
            onChange={(e) => setTenure(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter loan tenure in years"
          />
        </div>

        <button
          onClick={calculateEMI}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-500 transition duration-200"
        >
          Calculate EMI
        </button>

        {/* Display EMI result and Error */}
        <div className="mt-6 text-center">
          {error && <p className="text-red-600">{error}</p>}
          {emi !== null && (
            <div>
              <h3 className="text-xl font-semibold">Your EMI is:</h3>
              <p className="text-2xl font-bold text-green-600">₹{emi}</p>
            </div>
          )}
        </div>
      </div>

      {/* Loan Summary and Pie Chart Section */}
      <div className="flex flex-col items-center justify-center bg-gray-100 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold text-center mb-6">Loan Summary</h3>
        <div className="mb-6">
          <p className="text-lg">
            <strong>Principal Amount:</strong> ₹{principal || 0}
          </p>
          <p className="text-lg">
            <strong>Annual Interest Rate:</strong> {annualRate || 0}%
          </p>
          <p className="text-lg">
            <strong>Loan Tenure:</strong> {tenure || 0} years
          </p>
        </div>

        {/* Pie Chart */}
        <div className="w-full h-64">
          <Pie data={pieChartData} />
        </div>
      </div>
    </div>
  );
};

export default EMICalculator;
