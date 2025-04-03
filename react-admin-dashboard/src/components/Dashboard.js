import React, { useState, useEffect } from "react";
import axios from "axios";
import ClientWiseChart from "./ClientWiseChart";
import SpocWiseChart from "./SpocWiseChart";
import DispositionWiseChart from "./DispositionWiseChart";
import { CSVLink } from "react-csv";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
} from "@react-pdf/renderer";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import EndClientWiseBubbleChart from "./EndClientWiseBubbleChart";
import BclOpsTlWiseBarChart from "./BclOpsTlWiseBarChart"; // Import the new chart

// Example PDF document component
const MyDocument = ({ totalLeads }) => (
  <Document>
    <Page size="A4">
      <View style={{ padding: 30 }}>
        <Text>Total Leads: {totalLeads}</Text>
      </View>
    </Page>
  </Document>
);

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ startDate: "", endDate: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedDate, setSelectedDate] = useState(null);
  const [leadDataForDay, setLeadDataForDay] = useState([]);
  const [isToggleOn, setIsToggleOn] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [qualityData, setQualityData] = useState([]);
  const [leadQQDataForDay, setLeadQQDataForDay] = useState([]);

  const fetchData = async (diffDays) => {
    setPageLoading(true);
    try {
      const response = await axios.get(
        `http://192.168.1.36:3032/report?diffDays=${diffDays}`
      );
      if (Array.isArray(response.data)) {
        const formattedData = response.data.map((item) => ({
          ...item,
          total_records: parseInt(item.total_records, 10),
        }));
        setData(formattedData);
        setPageLoading(false);
      } else {
        setError("Unexpected data format received from server.");
        setPageLoading(false);
      }
    } catch (err) {
      setPageLoading(false);

      setError("Failed to load report data.");
    } finally {
      setPageLoading(false);

      setLoading(false);
    }
  };

  const fetchLeadDataForDay = async (diffDays) => {
    setPageLoading(true);

    try {
      const response = await axios.get(
        `http://192.168.1.36:3032/report/lead-data?diffDays=${diffDays}`
      );
      setLeadDataForDay(response.data);
      console.log("Lead Data for the Day", response.data);
      setPageLoading(false);
    } catch (err) {
      setPageLoading(false);

      setError("Failed to load lead data for the day.");
    }
  };

  const fetchQQData = async (diffDays) => {
    setPageLoading(true);
    try {
      const response = await axios.get(
        `http://192.168.1.36:3032/qqreport?diffDays=${diffDays}`
      );
      if (Array.isArray(response.data)) {
        const formattedData = response.data.map((item) => ({
          ...item,
          total_records: parseInt(item.total_records, 10),
        }));
        setQualityData(formattedData);
        setPageLoading(false);
      } else {
        setError("Unexpected data format received from server.");
        setPageLoading(false);
      }
    } catch (err) {
      setPageLoading(false);

      setError("Failed to load report data.");
    } finally {
      setPageLoading(false);

      setLoading(false);
    }
  };

  const fetchQQLeadDataForDay = async (diffDays) => {
    setPageLoading(true);

    try {
      const response = await axios.get(
        `http://192.168.1.36:3032/report/qqlead-data?diffDays=${diffDays}`
      );
      setLeadQQDataForDay(response.data);
      console.log("QQ Lead Data for the Day", response.data);
      setPageLoading(false);
    } catch (err) {
      setPageLoading(false);

      setError("Failed to load lead data for the day.");
    }
  };

  useEffect(() => {
    const diffDays = selectedDate
      ? Math.ceil((new Date() - selectedDate) / (1000 * 60 * 60 * 24)) - 1
      : 0;
    if (isToggleOn) {
      fetchData(diffDays);
      fetchLeadDataForDay(diffDays);
    } else {
      fetchQQData(diffDays);
      fetchQQLeadDataForDay(diffDays);
    }
  }, [selectedDate, isToggleOn]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  if (loading) return <div className="text-white">Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  const totalLeads = (isToggleOn ? data : qualityData).reduce(
    (acc, curr) => acc + curr.total_records,
    0
  );

  const getCounts = (key, sourceData) => {
    return sourceData.reduce((acc, item) => {
      const field = item[key]; // Get the value of the key in the current item
      if (field) {
        // If the field exists, accumulate the total records
        acc[field] = (acc[field] || 0) + parseInt(item.total_records, 10);
      }
      return acc;
    }, {});
  };

  const clientWise = getCounts("client", isToggleOn ? data : qualityData);
  const spocWise = isToggleOn ? getCounts("delivery_spoc", data) : getCounts("qa_name", qualityData);
  const campaignWise = getCounts("campaign_id", isToggleOn ? data : qualityData);
  const dispositionWise = isToggleOn ? getCounts("call_disposition", data) : {};
  const endClientWise = getCounts("end_client_name", isToggleOn ? data : qualityData);
  const bclOpsTlWise = isToggleOn ? getCounts("bcl_ops_tl_name", data) : {};

  // Handle filter logic
  const filteredData = (isToggleOn ? data : qualityData).filter((item) => {
    const date = new Date(item.date_);
    const startDate = new Date(filter.startDate);
    const endDate = new Date(filter.endDate);
  
    return (
      (!filter.startDate || date >= startDate) &&
      (!filter.endDate || date <= endDate)
    );
  });

  const totalFilteredLeads = filteredData.reduce(
    (acc, curr) => acc + curr.total_records,
    0
  );

  // Filter the campaign data based on search term
  const filteredCampaignWise = Object.entries(campaignWise).filter(
    ([campaign]) =>
      searchTerm
        ? campaign.toLowerCase().includes(searchTerm.toLowerCase())
        : true
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredCampaignWise.length / itemsPerPage);

  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCampaignWise.slice(startIndex, endIndex);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    const pages = [];
    if (totalPages > 1) {
      pages.push(
        <button
          key="first"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="px-4 py-2 mx-1 bg-gray-700 text-white rounded-md"
        >
          First
        </button>
      );
      for (let i = 1; i <= totalPages; i++) {
        if (
          i === 1 ||
          i === totalPages ||
          (i >= currentPage - 1 && i <= currentPage + 1)
        ) {
          pages.push(
            <button
              key={i}
              onClick={() => handlePageChange(i)}
              className={`px-4 py-2 mx-1 ${currentPage === i ? "bg-indigo-600" : "bg-gray-700"
                } text-white rounded-md`}
            >
              {i}
            </button>
          );
        } else if (i === currentPage - 2 || i === currentPage + 2) {
          pages.push(
            <span key={`dots-${i}`} className="px-4 py-2 mx-1 text-gray-500">
              ...
            </span>
          );
        }
      }
      pages.push(
        <button
          key="last"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 mx-1 bg-gray-700 text-white rounded-md"
        >
          Last
        </button>
      );
    }
    return <div className="flex justify-center mt-4">{pages}</div>;
  };

  return (
    <>
      <div className="p-6 bg-gray-900 min-h-screen">
        <h1 className="text-4xl font-extrabold text-white mb-8 animate-fadeIn">
          <span className="text-indigo-500">Dashboard</span>
        </h1>
        <div className="mb-6 flex flex-row items-start gap-3">
          <div>
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              dateFormat="MMMM d, yyyy"
              maxDate={new Date()}
              className="p-2 rounded-md border border-gray-500 bg-gray-900 text-white"
              placeholderText="Select a date"
            />
            {selectedDate && (
              <div className="text-white mt-2">
                Selected Date: {selectedDate.toLocaleDateString()}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-white">Toggle:</span>
            <button
              onClick={() => setIsToggleOn(!isToggleOn)}
              className="relative w-14 h-7 flex items-center bg-gray-500 rounded-full p-1 transition duration-300"
            >
              <span
                className={`absolute left-1 w-5 h-5 bg-white rounded-full shadow-md transform transition-all duration-300 ${isToggleOn ? "translate-x-7 bg-green-500" : "bg-gray-300"
                  }`}
              ></span>
            </button>
            <span className="text-white font-semibold">
              {isToggleOn ? "Master" : "Qualified"}
            </span>
          </div>
        </div>
        {/* Date Picker Section */}
        {pageLoading ? (
          <div className="animate-pulse bg-transparent ">
            {/* Date Picker & Toggle */}
            <div className="mb-6 flex flex-row items-start gap-3 ">
              <Skeleton
                width={192}
                height={40}
                className="rounded-md bg-opacity-10"
                baseColor="rgba(255, 255, 255, 0.1)"
                highlightColor="rgba(255, 255, 255, 0.2)"
              />
            </div>

            {/* Export Buttons */}
            <div className="mb-6 flex gap-6">
              <Skeleton
                width={160}
                height={48}
                className="rounded-lg"
                baseColor="rgba(255, 255, 255, 0.1)"
                highlightColor="rgba(255, 255, 255, 0.2)"
              />
              <Skeleton
                width={160}
                height={48}
                className="rounded-lg"
                baseColor="rgba(255, 255, 255, 0.1)"
                highlightColor="rgba(255, 255, 255, 0.2)"
              />
              <Skeleton
                width={160}
                height={48}
                className="rounded-lg"
                baseColor="rgba(255, 255, 255, 0.1)"
                highlightColor="rgba(255, 255, 255, 0.2)"
              />
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Skeleton
                width="100%"
                height={96}
                className="rounded-lg"
                baseColor="rgba(255, 255, 255, 0.1)"
                highlightColor="rgba(255, 255, 255, 0.2)"
              />
              <Skeleton
                width="100%"
                height={96}
                className="rounded-lg"
                baseColor="rgba(255, 255, 255, 0.1)"
                highlightColor="rgba(255, 255, 255, 0.2)"
              />
              <Skeleton
                width="100%"
                height={96}
                className="rounded-lg"
                baseColor="rgba(255, 255, 255, 0.1)"
                highlightColor="rgba(255, 255, 255, 0.2)"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 mt-8">
              <Skeleton
                width="100%"
                height={208}
                className="rounded-lg"
                baseColor="rgba(255, 255, 255, 0.1)"
                highlightColor="rgba(255, 255, 255, 0.2)"
              />
              <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
                <Skeleton
                  width="100%"
                  height={208}
                  className="rounded-lg"
                  baseColor="rgba(255, 255, 255, 0.1)"
                  highlightColor="rgba(255, 255, 255, 0.2)"
                />
                <Skeleton
                  width="100%"
                  height={208}
                  className="rounded-lg"
                  baseColor="rgba(255, 255, 255, 0.1)"
                  highlightColor="rgba(255, 255, 255, 0.2)"
                />
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6 flex gap-6">
              
              <CSVLink
                data={isToggleOn ? data : qualityData}
                filename={"dashboard-data.csv"}
                className="bg-gradient-to-r from-green-500 to-green-700 text-white px-6 py-3 rounded-lg shadow-lg hover:from-green-600 hover:to-green-800 transition-all duration-300 ease-in-out transform "
              >
                Export to CSV
              </CSVLink>
              <PDFDownloadLink
                document={<MyDocument totalLeads={totalFilteredLeads} />}
                fileName="dashboard-data.pdf"
                className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-3 rounded-lg shadow-lg hover:from-blue-600 hover:to-blue-800 transition-all duration-300 ease-in-out transform "
              >
                {({ loading }) =>
                  loading ? "Loading document..." : "Export to PDF"
                }
              </PDFDownloadLink>
              <CSVLink
                data={isToggleOn ? leadDataForDay : leadQQDataForDay}
                
                filename={"lead-data-for-day.csv"}
                className="bg-gradient-to-r from-purple-500 to-purple-700 text-white px-6 py-3 rounded-lg shadow-lg hover:from-purple-600 hover:to-purple-800 transition-all duration-300 ease-in-out transform "
              >
                Download Lead of the Day
              </CSVLink>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg rounded-lg p-6 md:p-8">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Total Leads Suppressed
                </h2>
                <p className="text-4xl font-bold text-white">
                  {totalFilteredLeads}
                </p>
              </div>
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg rounded-lg p-6 md:p-8">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Date Suppressed
                </h2>
                <p className="text-4xl font-bold text-white">
                  {isToggleOn ? (data[0]?.date_) :(qualityData[0]?.date_) || "N/A"}
                </p>
              </div>
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg rounded-lg p-6 md:p-8">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Total Campaigns
                </h2>
                <p className="text-4xl font-bold text-white">
                  {Object.keys(campaignWise).length}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 mt-8">
              <div className="bg-gray-800 shadow-lg rounded-lg p-6 md:p-8 transform transition  duration-300">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Leads Suppressed Client Wise Delivery
                </h2>
                <ClientWiseChart data={spocWise} />
              </div>

              <div
                className={`grid gap-5 ${isToggleOn
                    ? "grid-cols-2"
                    : "grid-cols-1 w-full items-center justify-center"
                  }`}
              >
                <div className="w-full flex flex-col items-center justify-center bg-gray-800 shadow-lg rounded-lg p-6 md:p-8 transform transition  duration-300">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Leads Suppressed SPoC Wise
                  </h2>
                  <SpocWiseChart data={clientWise} />
                </div>
                {isToggleOn ? (
                  <div className="bg-gray-800 shadow-lg rounded-lg p-6 md:p-8 transform transition  duration-300">
                    <h2 className="text-xl font-semibold text-white mb-4 text-center">
                      Leads by Call Disposition
                    </h2>
                    <DispositionWiseChart data={dispositionWise} />
                  </div>
                ) : null}
              </div>
            </div>

            {isToggleOn ? (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {/* Chart 1 - Leads by End Client */}
                <div className="bg-gray-800 shadow-lg rounded-lg p-6 w-full">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Leads by End Client
                  </h2>
                  <div className="h-80 md:h-[400px] lg:h-[500px]">
                    {" "}
                    {/* Set the height dynamically */}
                    <EndClientWiseBubbleChart
                      data={Object.entries(endClientWise).map(
                        ([end_client_name, total_records]) => ({
                          end_client_name,
                          total_records,
                        })
                      )}
                    />
                  </div>
                </div>

                {/* Chart 2 - Leads by BCL Ops TL */}
                <div className="bg-gray-800 shadow-lg rounded-lg p-6 w-full">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Leads by BCL Ops TL
                  </h2>
                  <div className="h-80 md:h-[400px] lg:h-[500px]">
                    {" "}
                    {/* Set the height dynamically */}
                    <BclOpsTlWiseBarChart
                      data={Object.entries(bclOpsTlWise).map(
                        ([bcl_ops_tl_name, total_records]) => ({
                          bcl_ops_tl_name,
                          total_records,
                        })
                      )}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            <div className="bg-gray-800 shadow-lg rounded-lg p-6 md:p-8 mt-8 overflow-y-auto">
              <h2 className="text-xl font-semibold text-white mb-4">
                Leads Suppressed Campaign ID Wise
              </h2>

              {/* Search box */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 rounded-md border border-gray-500 bg-gray-900 text-white"
                />
              </div>

              {/* Paginated Campaign List */}
              <ul className="text-white">
                {getPaginatedData().map(([campaign, count]) => (
                  <li
                    key={campaign}
                    className="flex justify-between mb-2 border-b border-gray-700 pb-2"
                  >
                    <span>{campaign}</span>
                    <span>{count}</span>
                  </li>
                ))}
              </ul>

              {/* Pagination Controls */}
              {renderPagination()}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
