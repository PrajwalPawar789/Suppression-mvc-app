import React, { useState } from "react";
import image1 from "../images/gallery1.webp";
import image2 from "../images/gallery2.webp";
import image3 from "../images/gallery3.webp";
import image4 from "../images/gallery4.webp";
import image5 from "../images/gallery5.webp";
import image6 from "../images/gallery6.webp";
import image7 from "../images/gallery7.webp";
import image8 from "../images/gallery8.webp";
import logo from "../images/logo.svg";
import MasterPlan from './MasterPlan';
import Map from './Map';
import Faq from './Faq';
import Slider from './Slider';
import Footer from './Footer';
import Footer2 from './Footer2';
import YouTubeVideo from './YouTubeVideo';
import Amenities from "./Amenities";
import EMICalculator from "./EMICalculator"



const Imagegrid = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // List of images
  const images = [
    image1, image2, image3, image4, 
    image5, image6, image7, image8
  ];

  const openDialog = () => setIsDialogOpen(true);
  const closeDialog = () => setIsDialogOpen(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    // Handle form submission logic here
    alert("Form submitted!");
    closeDialog();
  };

  return (
    <>
   
    <div className="p-4">
      <h2
        className="text-center font-bold mb-8"
        style={{
          color: "#06a34e",
          fontSize: "30px",
          fontFamily: "Inter, sans-serif",
          marginTop: "50px",
        }}
      >
        KOLTE PATIL CANVAS - GALLERY
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {images.map((image, index) => (
          <div key={index} className="relative overflow-hidden">
            <img
              src={image}
              alt={`Image ${index + 1}`}
              className="object-cover w-full h-full"
            />
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-8">
        <button
          onClick={openDialog}
          className="bg-[#06a34e] text-white py-2 px-4 rounded-md text-lg font-semibold"
        >
          Enquire Now
        </button>
      </div>

      {/* Dialog Box */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg relative">
            <button
              onClick={closeDialog}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>

            <div className="flex justify-center mb-4">
            <img
              className="h-12 w-auto"
              src={logo}
              alt="Logo"
            />
        </div>


            <h3
        className="text-center font-bold "
        style={{
          color: "black",
          fontSize: "20px",
          fontFamily: "Inter, sans-serif",
          
        }}
      >
      I Am Interested In

      </h3>
            <h3
        className="text-center font-bold mb-8"
        style={{
          color: "#06a34e",
          fontSize: "20px",
          fontFamily: "Inter, sans-serif",
          marginTop: "10px", // Moves the heading lower on the page
        }}
      >
       KOLTE PATIL CANVAS
      </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    className="mt-1 block w-full border-2 border-black rounded-md shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    className="mt-1 block w-full border-2 border-black rounded-md shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="mt-1 block w-full border-2 border-black rounded-md shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    className="mt-1 block w-full border-2 border-black rounded-md shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <textarea
                    name="message"
                    rows="4"
                    className="mt-1 block w-full border-2 border-black rounded-md shadow-sm"
                    required
                  />
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    type="submit"
                    className="bg-[#06a34e] text-white py-2 px-4 rounded-md text-lg font-semibold"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    {/* <AboutSection />
      <AboutSection1 /> */}
      {/* <ImageDisplay/> */}
      {/* <YouTubeVideo/> */}
      {/* <BoxesWithImages/> */}
      {/* <Coming/> */}
      <Amenities/>
      <MasterPlan/>
      <EMICalculator/>
    
      <Map/>
      <Faq/>
      <Slider/>
      <Footer/>
      <Footer2/>

    </>
  );
};

export default Imagegrid;
