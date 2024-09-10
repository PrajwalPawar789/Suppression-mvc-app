import React, { useState } from "react";
import image1 from "../images/flat1.webp";
import image2 from "../images/flat2.webp";
import image3 from "../images/flat3.webp";
import fullImage from "../images/flat4.webp"; // Import a full image to be shown on second button click

const ImageDisplay = () => {
  const [view, setView] = useState("three"); // Default view is "three"
  const [activeButton, setActiveButton] = useState("three"); // Default button active

  const showThreeImages = () => {
    setView("three");
    setActiveButton("three");
  };

  const showFullImage = () => {
    setView("full");
    setActiveButton("full");
  };

  return (
    <div className="p-4">
      <h1
        className="text-center font-bold mb-8"
        style={{
          color: "#06a34e",
          fontSize: "30px",
          fontFamily: "Inter, sans-serif",
          marginTop: "50px",
        }}
      >
        UNIT PLAN - KOLTE PATIL CANVAS
      </h1>
      <div className="flex flex-col md:flex-row justify-center mb-8 space-y-4 md:space-y-0 md:space-x-4">
        <button
          onClick={showThreeImages}
          className={`py-2 px-4 rounded-md text-lg font-semibold ${activeButton === "three" ? "bg-[#04b34d] text-white" : "bg-[#06a34e] text-white"}`}
        >
          3 BHK & 3 BHK XL
        </button>
        <button
          onClick={showFullImage}
          className={`py-2 px-4 rounded-md text-lg font-semibold ${activeButton === "full" ? "bg-[#04b34d] text-white" : "bg-[#06a34e] text-white"}`}
        >
          4 BHK
        </button>
      </div>

      {view === "three" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <img
            src={image1}
            alt="Image 1"
            className="object-cover w-full h-auto"
          />
          <img
            src={image2}
            alt="Image 2"
            className="object-cover w-full h-auto"
          />
          <div className="col-span-2">
            <img
              src={image3}
              alt="Image 3"
              className="object-cover w-full h-auto"
            />
          </div>
        </div>
      )}

      {view === "full" && (
        <div className="flex justify-center mt-8">
          <img
            src={fullImage}
            alt="Full Image"
            className="object-cover w-full max-w-screen-sm h-auto"
          />
        </div>
      )}
    </div>
  );
};

export default ImageDisplay;
