// EndClientWiseBarChart.js

import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, Tooltip, Legend, Title, LinearScale, BarElement, CategoryScale } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';  // Import the datalabels plugin

ChartJS.register(Tooltip, Legend, Title, LinearScale, BarElement, CategoryScale, ChartDataLabels); // Register the plugin

const EndClientWiseBarChart = ({ data }) => {
  // Prepare the data for the bar chart
  const chartData = {
    labels: data.map(client => client.end_client_name), // X-axis labels (client names)
    datasets: [{
      label: 'Total Records by End Client', // Dataset label
      data: data.map(client => client.total_records), // Y-axis values (total_records for each client)
      backgroundColor: data.map((client, index) => `rgba(${75 + index * 20}, ${192}, ${192}, 0.6)`), // Different color for each bar
      borderColor: 'white', // Border color for bars
      borderWidth: 1, // Border width for bars
    }],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'white', // Legend text color
        },
      },
      title: {
        display: true,
        text: 'Total Records by End Client', // Title text
        color: 'white', // Title text color
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem) => `${tooltipItem.dataset.label}: ${tooltipItem.raw}`, // Custom tooltip label
        },
        titleColor: 'white', // Tooltip title color
        bodyColor: 'white', // Tooltip body color
      },
      // Enable the data labels plugin
      datalabels: {
        color: 'white', // Set the data labels text color to white
        anchor: 'end', // Position the text at the end of each bar
        align: 'top', // Align the text at the top of the bars
        font: {
          weight: 'bold', // Make the text bold
          size: 14, // Font size for the data labels
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'End Client', // X-axis title
          color: 'white',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.2)', // Grid line color
        },
        ticks: {
          color: 'white', // X-axis ticks color
        },
      },
      y: {
        title: {
          display: true,
          text: 'Total Records', // Y-axis title
          color: 'white',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.2)', // Grid line color
        },
        ticks: {
          color: 'white', // Y-axis ticks color
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default EndClientWiseBarChart;
