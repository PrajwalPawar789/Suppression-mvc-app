import React from 'react';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadarController, RadialLinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(RadarController, RadialLinearScale, PointElement, LineElement, Tooltip, Legend);

const DispositionWiseRadarChart = ({ data }) => {
  const labels = Object.keys(data);
  const values = Object.values(data);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Leads by Call Disposition',
        data: values,
        backgroundColor: 'rgba(54, 162, 235, 0.2)', // Blue
        borderColor: 'rgba(54, 162, 235, 1)', // Blue
        borderWidth: 1,
        pointBackgroundColor: 'rgba(54, 162, 235, 1)', // Blue
      },
    ],
  };

  const options = {
    scales: {
      r: {
        angleLines: {
          display: true,
          color: 'rgba(255, 255, 255, 0.2)', // Color of the angle lines
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.2)', // Color of the grid lines
        },
        ticks: {
          display: true,
          color: 'white', // Color of the ticks
          backdropColor: 'rgba(0, 0, 0, 0.5)', // Background color of tick labels
        },
        pointLabels: {
          color: 'white', // Color of the point labels
        },
        suggestedMin: 0,
        suggestedMax: Math.max(...values) * 1.2, // Adjust max value to be 20% higher than the max data value
      },
    },
    plugins: {
      legend: {
        labels: {
          color: 'white', // Color of the legend labels
        },
      },
      title: {
        display: true,
        text: 'Leads by Call Disposition',
        color: 'white', // Color of the chart title
      },
    },
  };

  return <Radar data={chartData} options={options} />;
};

export default DispositionWiseRadarChart;
