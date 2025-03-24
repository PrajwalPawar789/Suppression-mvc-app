import { useState, useEffect } from "react";
import ProspectTable from "./ProspectTable";
import Loader from "./Loader";
import Contactandcompany from "./contactandcompany";
import IndustryFilter from "./IndustryFilter";
import JobTitleFilter from "./JobTitleFilter";
import Navbar from "./Navbar";
import CountryFilter from "./CountryFilter";
import JobLevelFilter from "./JobLevelFilter";
import JobFunctionFilter from "./JobFunctionFilter";
import EmployeeSizeFilter from "./EmployeeSizeFilter";
import CompanyNameFilter from "./CompanyNameFilter";
import Sub_Industry from './Sub_Industry';
import Region from './Region'
import * as XLSX from "xlsx";
import LeadTaggingFilter from "./LeadTaggingFilter";

export default function SearchPage() {
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState([]);
  const [selectedSubIndustries, setSelectedSubIndustries] = useState([]);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [selectedTitles, setSelectedTitles] = useState([]);
  const [selectedTitles1, setSelectedTitles1] = useState([]);
  const [selectedTitles3, setSelectedTitles3] = useState([]);
  const [selectedTitles4, setSelectedTitles4] = useState([]);

  const [selectedLevels, setSelectedLevels] = useState([]);
  const [selectedFunctions, setSelectedFunctions] = useState([]);
  const [companyName, setCompanyName] = useState("");
  const [fetchedProspects, setFetchedProspects] = useState([]);
  const [totalContacts, setTotalContacts] = useState(0);
  const [industrySearchTerm, setIndustrySearchTerm] = useState("");
  const [SubindustrySearchTerm, setSubIndustrySearchTerm] = useState("");
  const [titleSearchTerm, setTitleSearchTerm] = useState("");
  const [functionSearchTerm, setFunctionSearchTerm] = useState("");
  const [levelSearchTerm, setLevelSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [countrySearchTerm, setCountrySearchTerm] = useState("");
  const [regionSearchTerm, setRegionSearchTerm] = useState("");
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  const [sizeSearchTerm, setSizeSearchTerm] = useState("");
  const [tagSearchTerm, setTagSearchTerm] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const [selectedIncludedCompanies, setSelectedIncludedCompanies] = useState(
    []
  );
  const [selectedExcludedCompanies, setSelectedExcludedCompanies] = useState(
    []
  );
  const [selectedIncludedCompanies3, setSelectedIncludedCompanies3] = useState(
    []
  );
  const [selectedIncludedCompanies4, setSelectedIncludedCompanies4] = useState(
    []
  );

  useEffect(() => {
    const fetchFilteredProspects = async () => {
        
      setLoading(true);
  
      // Check if any filter is selected
      if (
        selectedIndustries.length > 0 ||
        selectedSubIndustries.length > 0 ||
        selectedTitles.length > 0 ||
        selectedTitles1.length > 0 ||
        selectedTitles3.length > 0 ||
        selectedTitles4.length > 0 ||
        selectedLevels.length > 0 ||
        selectedFunctions.length > 0 ||
        selectedSizes.length > 0 ||
        selectedTags.length > 0 ||
        companyName ||
        selectedCountry ||
        selectedRegion ||
        selectedState ||
        selectedCity ||
        selectedIncludedCompanies.length > 0 ||
        selectedExcludedCompanies.length > 0 ||
        selectedIncludedCompanies3.length > 0 ||
        selectedIncludedCompanies4.length > 0
      ) {
        // First API call
        const response1 = await fetch("http://192.168.1.36:5030/api/v1/fetchLeads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            selectedIndustries,
            selectedSubIndustries,
            selectedTitles,
            selectedTitles1,
            selectedTitles3,
            selectedTitles4,
            selectedLevels,
            selectedFunctions,
            selectedSizes,
            selectedTags,
            companyName,
            selectedCountry,
            selectedRegion,
            selectedState,
            selectedCity,
            selectedIncludedCompanies,
            selectedExcludedCompanies,
            selectedIncludedCompanies3,
            selectedIncludedCompanies4,
          }),
        });
  
        if (response1.ok) {
          const data1 = await response1.json();
          console.log("Fetched data from first API:", data1.data);
          if (data1.success) {
            setTotalContacts(data1.data[0].totalContacts);
            setTotalCompanies(data1.data[0].totalCompanies);
          } else {
            console.error("Failed to fetch counts from first API:", data1.message);
          }
        } else {
          console.error("Failed to fetch prospects from first API");
        }
  
        // Second API call
        const response2 = await fetch("http://192.168.1.36:5030/api/v1/fetchLeads2", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            selectedIndustries,
            selectedSubIndustries,
            selectedTitles,
            selectedTitles1,
            selectedTitles3,
            selectedTitles4,
            selectedLevels,
            selectedFunctions,
            selectedSizes,
            selectedTags,
            companyName,
            selectedCountry,
            selectedRegion,
            selectedState,
            selectedCity,
            selectedIncludedCompanies,
            selectedExcludedCompanies,
            selectedIncludedCompanies3,
            selectedIncludedCompanies4,
          }),
        });

  
        if (response2.ok) {
          const data2 = await response2.json();
          setFetchedProspects(data2.data);

          console.log("Fetched data from second API:", data2.data);
          // Handle data from the second API call as needed
        } else {
          console.error("Failed to fetch prospects from second API");
        }
      } else {
        console.log("No filters selected, skipping API calls.");
      }
  
      setLoading(false);
    };
  
    fetchFilteredProspects();
  }, [
    selectedIndustries,
    selectedSubIndustries,
    selectedTitles,
    selectedTitles1,
    selectedTitles3,
    selectedTitles4,
    selectedLevels,
    selectedFunctions,
    selectedSizes,
    selectedTags,
    companyName,
    selectedCountry,
    selectedRegion,
    selectedState,
    selectedCity,
    selectedIncludedCompanies,
    selectedExcludedCompanies,
    selectedIncludedCompanies3,
    selectedIncludedCompanies4,
  ]);
  
  

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://192.168.1.36:5030/api/v1/fetchLeads1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedIndustries,
          selectedSubIndustries,
          selectedTitles,
          selectedTitles1,
          selectedTitles3,
          selectedTitles4,
          selectedLevels,
          selectedFunctions,
          selectedSizes,
          selectedTags,
          companyName,
          selectedCountry,
          selectedRegion,
          selectedState,
          selectedCity,
          selectedIncludedCompanies,
          selectedExcludedCompanies,
          selectedIncludedCompanies3,
          selectedIncludedCompanies4,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          if (totalContacts > 700000) {
            alert(
              `Cannot download. The record count is ${data.totalRecords}, which exceeds the limit of 200,000.`
            );
          } else {
            const worksheet = XLSX.utils.json_to_sheet(data.data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Prospects");
            XLSX.writeFile(workbook, "filtered_prospects.xlsx");
          }
        } else {
          console.error("Failed to fetch data for download");
        }
      } else {
        console.error("Failed to fetch data");
      }
    } catch (error) {
      console.error("Error during download:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIndustrySelection = (selectedOption) => {
    console.log("Selected industry:", selectedOption);
    setSelectedIndustries((prevSelected) =>
      prevSelected.includes(selectedOption)
        ? prevSelected.filter((industry) => industry !== selectedOption)
        : [...prevSelected, selectedOption]
    );
  };

  const handleSubIndustrySelection = (selectedOption) => {
    console.log("Selected industry:", selectedOption);
    setSelectedSubIndustries((prevSelected) =>
      prevSelected.includes(selectedOption)
        ? prevSelected.filter((industry) => industry !== selectedOption)
        : [...prevSelected, selectedOption]
    );
  };

  const handleTitleSelection = (selectedOption) => {
    if (Array.isArray(selectedOption)) {
      setSelectedTitles(selectedOption);
    } else {
      setSelectedTitles((prevSelected) =>
        prevSelected.includes(selectedOption)
          ? prevSelected.filter((title) => title !== selectedOption)
          : [...prevSelected, selectedOption]
      );
    }
  };

  const handleCompanySelection = (companies) => {
    // Handle the selection of included companies
    setSelectedIncludedCompanies(companies);
  };

  const handleCompanySelection3 = (companies) => {
    // Handle the selection of included companies
    setSelectedIncludedCompanies3(companies);
  };

  const handleCompanySelection4 = (companies) => {
    // Handle the selection of included companies
    setSelectedIncludedCompanies4(companies);
  };

  const handleCompanySelection1 = (companies) => {
    // Handle the selection of excluded companies
    setSelectedExcludedCompanies(companies);
  };

  const handleTitleSelection1 = (selectedOption) => {
    if (Array.isArray(selectedOption)) {
      setSelectedTitles1(selectedOption);
    } else {
      setSelectedTitles1((prevSelected) =>
        prevSelected.includes(selectedOption)
          ? prevSelected.filter((title) => title !== selectedOption)
          : [...prevSelected, selectedOption]
      );
    }
  };

  const handleTitleSelection3 = (selectedOption) => {
    if (Array.isArray(selectedOption)) {
      setSelectedTitles3(selectedOption);
    } else {
      setSelectedTitles3((prevSelected) =>
        prevSelected.includes(selectedOption)
          ? prevSelected.filter((title) => title !== selectedOption)
          : [...prevSelected, selectedOption]
      );
    }
  };

  const handleTitleSelection4 = (selectedOption) => {
    if (Array.isArray(selectedOption)) {
      setSelectedTitles4(selectedOption);
    } else {
      setSelectedTitles4((prevSelected) =>
        prevSelected.includes(selectedOption)
          ? prevSelected.filter((title) => title !== selectedOption)
          : [...prevSelected, selectedOption]
      );
    }
  };

  const handleSizeSelection = (selectedOption) => {
    setSelectedSizes((prevSelected) =>
      prevSelected.includes(selectedOption)
        ? prevSelected.filter((size) => size !== selectedOption)
        : [...prevSelected, selectedOption]
    );
  };

  const handleTagSelection = (selectedOption) => {
    setSelectedTags((prevSelected) =>
      prevSelected.includes(selectedOption)
        ? prevSelected.filter((size) => size !== selectedOption)
        : [...prevSelected, selectedOption]
    );
  };

  const handleSizeSearchChange = (event) => {
    setSizeSearchTerm(event.target.value.toLowerCase());
  };

  const handleTagSearchChange = (event) => {
    setTagSearchTerm(event.target.value.toLowerCase());
  };

  const handleFunctionSelection = (selectedOption) => {
    console.log("Selected function:", selectedOption);
    setSelectedFunctions((prevSelected) =>
      prevSelected.includes(selectedOption)
        ? prevSelected.filter((func) => func !== selectedOption)
        : [...prevSelected, selectedOption]
    );
  };

  const handleLevelSelection = (selectedOption) => {
    console.log("Selected level:", selectedOption);
    setSelectedLevels((prevSelected) =>
      prevSelected.includes(selectedOption)
        ? prevSelected.filter((level) => level !== selectedOption)
        : [...prevSelected, selectedOption]
    );
  };

  const handleCountrySelection = (selectedOption) => {
    setSelectedCountry((prevSelected) =>
      prevSelected.includes(selectedOption)
        ? prevSelected.filter((country) => country !== selectedOption)
        : [...prevSelected, selectedOption]
    );
  };

  const handleRegionSelection = (selectedOption) => {
    setSelectedRegion((prevSelected) =>
      prevSelected.includes(selectedOption)
        ? prevSelected.filter((country) => country !== selectedOption)
        : [...prevSelected, selectedOption]
    );
  };

  const handleCompanyNameSearchChange = (event) => {
    setCompanyName(event.target.value);
  };

  const handleCompanyNameInput = (companies, excluded) => {
    if (excluded) {
      setSelectedExcludedCompanies(companies);
    } else {
      setSelectedIncludedCompanies(companies);
    }
  };

  const handleIndustrySearchChange = (event) => {
    setIndustrySearchTerm(event.target.value.toLowerCase());
  };

  const handleSubIndustrySearchChange = (event) => {
    setSubIndustrySearchTerm(event.target.value.toLowerCase());
  };

  const handleTitleSearchChange = (event) => {
    setTitleSearchTerm(event.target.value.toLowerCase());
  };

  const handleFunctionSearchChange = (event) => {
    setFunctionSearchTerm(event.target.value.toLowerCase());
  };

  const handleLevelSearchChange = (event) => {
    setLevelSearchTerm(event.target.value.toLowerCase());
  };

  const handleCountrySearchChange = (event) => {
    setCountrySearchTerm(event.target.value.toLowerCase());
  };

  const handleRegionSearchChange = (event) => {
    setRegionSearchTerm(event.target.value.toLowerCase());
  };

  const handleCountryChange = (event) => {
    setSelectedCountry(event.target.value);
    setSelectedState("");
    setSelectedCity("");
  };

  const handleStateChange = (event) => {
    setSelectedState(event.target.value);
    setSelectedCity("");
  };

  const handleCityChange = (event) => {
    setSelectedCity(event.target.value);
  };

  return (
    <>
      <Navbar />
      <div className="">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
  <div className="flex gap-11 items-center border-b border-gray-200 pb-6 pt-14">
  <h1 className="text-4xl font-bold tracking-tight text-gray-900 mr-4">
    Prospect search
  </h1>
  <Contactandcompany
    totalContacts={totalContacts}
    totalCompanies={totalCompanies}
  />
  
  <button
    onClick={() => window.location.href = "http://192.168.1.36:3033/search"}
    className="relative flex items-center bg-green-100 text-green-800 text-sm font-semibold px-4 py-2 rounded-md transition-all duration-300 hover:bg-green-200 focus:outline-none"
  >
    Go to Search
  </button>

  <button
    onClick={handleDownload}
    className={`relative flex items-center bg-blue-100 text-blue-800 text-sm font-semibold px-4 py-2 rounded-md transition-all duration-300 hover:from-blue-600 hover:to-blue-800 focus:outline-none ${
      isLoading ? "cursor-not-allowed" : ""
    }`}
    disabled={isLoading}
  >
    {isLoading ? (
      <>
        <svg
          className="animate-spin h-5 w-5 mr-3 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0c-5.523 0-10 4.477-10 10h2zm2 5.291A7.952 7.952 0 014 12H2c0 2.21.896 4.21 2.344 5.656l1.656-1.365z"
          ></path>
        </svg>
        Downloading...
      </>
    ) : (
      "Download Excel"
    )}
  </button>
</div>


          <section aria-labelledby="prospects-heading" className="pb-24 pt-6">
            <h2 id="prospects-heading" className="sr-only">
              Prospects
            </h2>

            <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-4">
              {/* Filters */}
              <form className="hidden lg:block">
                <h3 className="sr-only">Categories</h3>
                <div>
                  <CompanyNameFilter
                    selectedCompanies={[]} // Pass any necessary prop or remove if not used
                    handleCompanySelection={handleCompanySelection}
                    handleCompanySelection1={handleCompanySelection1}
                    companySearchTerm={companyName}
                    handleCompanySearchChange={handleCompanyNameSearchChange}
                    handleCompanySelection3={handleCompanySelection3}
                    handleCompanySelection4={handleCompanySelection4}
                  />
                </div>

                <IndustryFilter
                  selectedIndustries={selectedIndustries}
                  handleIndustrySelection={handleIndustrySelection}
                  industrySearchTerm={industrySearchTerm}
                  handleIndustrySearchChange={handleIndustrySearchChange}
                />

                <Sub_Industry
                  selectedSubIndustries={selectedSubIndustries}
                  handleSubIndustrySelection={handleSubIndustrySelection}
                  SubindustrySearchTerm={SubindustrySearchTerm}
                  handleSubIndustrySearchChange={handleSubIndustrySearchChange}
                />
                <JobTitleFilter
                  selectedTitles={selectedTitles}
                  handleTitleSelection={handleTitleSelection}
                  handleTitleSelection1={handleTitleSelection1}
                  handleTitleSelection3={handleTitleSelection3}
                  handleTitleSelection4={handleTitleSelection4}
                  titleSearchTerm={titleSearchTerm}
                  handleTitleSearchChange={handleTitleSearchChange}
                />
                <JobFunctionFilter
                  selectedFunctions={selectedFunctions}
                  handleFunctionSelection={handleFunctionSelection}
                  functionSearchTerm={functionSearchTerm}
                  handleFunctionSearchChange={handleFunctionSearchChange}
                />
                <JobLevelFilter
                  selectedLevels={selectedLevels}
                  handleLevelSelection={handleLevelSelection}
                  handleLevelSearchChange={handleLevelSearchChange}
                  levelSearchTerm={levelSearchTerm}
                />
                <EmployeeSizeFilter
                  selectedSizes={selectedSizes}
                  handleSizeSelection={handleSizeSelection}
                  sizeSearchTerm={sizeSearchTerm}
                  handleSizeSearchChange={handleSizeSearchChange}
                />

                <LeadTaggingFilter
                  selectedTags={selectedTags}
                  handleTagSelection={handleTagSelection}
                  handleTagSearchChange={handleTagSearchChange}
                  tagSearchTerm={tagSearchTerm}
                />

                <CountryFilter
                  selectedCountry={selectedCountry}
                  handleCountrySelection={handleCountrySelection}
                  handleCountrySearchChange={handleCountrySearchChange}
                  countrySearchTerm={countrySearchTerm}
                />
                <Region
                  selectedRegion={selectedRegion}
                  handleRegionSelection={handleRegionSelection}
                  handleRegionSearchChange={handleRegionSearchChange}
                  regionSearchTerm={regionSearchTerm}
                />
              </form>

              {/* <div className="lg:col-span-3">
                {loading ? (
                  <Loader />
                ) : (
                  <h1>successful</h1>
                  // <ProspectTable prospects={fetchedProspects} />
                )}
              </div> */}
              <div className="lg:col-span-3">
                {totalContacts?.length > 0 ? <> {loading ? (
                  <>Select Filter First loader</>
                ) : (
                  <ProspectTable prospects={fetchedProspects} />
                )}</>:<>Select Filter First</>}
               
              </div>

            </div>
          </section>
        </main>
      </div>
    </>
  );
}
