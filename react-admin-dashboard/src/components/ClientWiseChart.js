import React, { useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import { FaChartLine } from "react-icons/fa6";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import zoomPlugin from "chartjs-plugin-zoom";
import { BsBarChartLineFill } from "react-icons/bs";

// Register Chart.js components and plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels,
  zoomPlugin
);

const ClientWiseChart = ({ data }) => {
  const [chartType, setChartType] = useState("bar"); // State to toggle chart type

  const chartData = {
    labels: Object.keys(data),
    datasets: [
      {
        label: "Leads Suppressed Client Wise",
        data: Object.values(data),
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        labels: {
          color: "white",
        },
      },
      title: {
        display: true,
        text: "Leads Suppressed Client Wise",
        color: "white",
      },
      datalabels: {
        color: "white",
        anchor: "end",
        align: "start",
        formatter: (value) => value,
      },
      zoom: {
        pan: {
          enabled: true,
          mode: "x",
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: "x",
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "white",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.2)",
        },
      },
      y: {
        ticks: {
          color: "white",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.2)",
        },
      },
    },
    maintainAspectRatio: false, // Allow custom height
  };

  return (
    <div className="relative" style={{ textAlign: "center", color: "white" }}>
      <div className="absolute flex justify-center gap-4 mb-4 top-0 right-10">
        <div
          onClick={() => setChartType("line")}
          className={`cursor-pointer p-2 w-12 h-12 flex items-center justify-center rounded-lg shadow-lg transition-all ${
            chartType === "line" ? "bg-blue-500" : "bg-gray-800"
          }`}
        >
          <FaChartLine className="text-white text-2xl" />
        </div>

        <div
          onClick={() => setChartType("bar")}
          className={`cursor-pointer p-2 w-12 h-12 flex items-center justify-center rounded-lg shadow-lg transition-all ${
            chartType === "bar" ? "bg-blue-500" : "bg-gray-800"
          }`}
        >
          <BsBarChartLineFill className="text-white text-2xl" />
        </div>
      </div>

      <div style={{ height: "500px", width: "100%" }}>
        {chartType === "bar" ? (
          <Bar data={chartData} options={options} />
        ) : (
          <Line data={chartData} options={options} />
        )}
      </div>
    </div>
  );
};

export default ClientWiseChart;
