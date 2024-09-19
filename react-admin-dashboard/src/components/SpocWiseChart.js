import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, registerables } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, ...registerables);

const SpocWiseChart = ({ data }) => {
  const chartData = {
    labels: Object.keys(data),
    datasets: [
      {
        label: 'Leads Suppressed Delivery Client Wise',
        data: Object.values(data),
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)', 
          'rgba(54, 162, 235, 0.2)', 
          'rgba(255, 206, 86, 0.2)', 
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)', 
          'rgba(255, 159, 64, 0.2)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)', 
          'rgba(54, 162, 235, 1)', 
          'rgba(255, 206, 86, 1)', 
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)', 
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#ffffff', // Legend text color
        },
      },
      title: {
        display: true,
        text: 'SPoC Wise Leads',
        color: '#ffffff', // Title text color
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem) => {
            return `${tooltipItem.label}: ${tooltipItem.raw}`;
          },
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)', // Tooltip background color
        titleColor: '#ffffff', // Tooltip title text color
        bodyColor: '#ffffff', // Tooltip body text color
      },
      // Custom plugin to show counts inside the pie sections
      datalabels: {
        color: '#ffffff',
        formatter: (value, context) => {
          return value; // Show the count value inside the pie sections
        },
      },
    },
    borderWidth: 1,
  };

  return <Pie data={chartData} options={options} />;
};

export default SpocWiseChart;
