import React, { useState } from "react";
import { Doughnut, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  registerables,
} from "chart.js";
import { FaChartPie, FaChartArea } from "react-icons/fa";
import { BiDoughnutChart } from "react-icons/bi";

ChartJS.register(ArcElement, Tooltip, Legend, ...registerables);

const SpocWiseChart = ({ data }) => {
  const [chartType, setChartType] = useState("pie");
  const chartData = {
    labels: Object.keys(data),
    datasets: [
      {
        label: "Leads Suppressed Delivery Client Wise",
        data: Object.values(data),
        backgroundColor: [
          "rgba(255, 99, 132, 0.2)",
          "rgba(54, 162, 235, 0.2)",
          "rgba(255, 206, 86, 0.2)",
          "rgba(75, 192, 192, 0.2)",
          "rgba(153, 102, 255, 0.2)",
          "rgba(255, 159, 64, 0.2)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#ffffff", // Legend text color
        },
      },
      title: {
        display: true,
        text: "SPoC Wise Leads",
        color: "#ffffff", // Title text color
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem) => {
            return `${tooltipItem.label}: ${tooltipItem.raw}`;
          },
        },
        backgroundColor: "rgba(0, 0, 0, 0.8)", // Tooltip background color
        titleColor: "#ffffff", // Tooltip title text color
        bodyColor: "#ffffff", // Tooltip body text color
      },
      // Custom plugin to show counts inside the pie sections
      datalabels: {
        color: "#ffffff",
        formatter: (value, context) => {
          return value; // Show the count value inside the pie sections
        },
      },
    },
    borderWidth: 1,
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-auto">
      <div className="absolute flex justify-center gap-4 mb-4 top-0 right-10">
        <div
          onClick={() => setChartType("pie")}
          className={`cursor-pointer p-2 w-12 h-12 flex items-center justify-center rounded-lg shadow-lg transition-all ${
            chartType === "pie" ? "bg-blue-500" : "bg-gray-800"
          }`}
        >
          <FaChartPie className="text-white text-2xl" />
        </div>

        <div
          onClick={() => setChartType("doughnut")}
          className={`cursor-pointer p-2 w-12 h-12 flex items-center justify-center rounded-lg shadow-lg transition-all ${
            chartType === "doughnut" ? "bg-blue-500" : "bg-gray-800"
          }`}
        >
          <BiDoughnutChart Area className="text-white text-2xl" />
        </div>
      </div>

      <div
        className="flex items-center justify-center"
        style={{ height: "500px", width: "500px" }}
      >
        {chartType === "pie" ? (
          <Pie data={chartData} options={options} />
        ) : (
          <Doughnut data={chartData} options={options} />
        )}
      </div>
    </div>
  );
};

export default SpocWiseChart;
