import React from "react";
import Flippy, { FrontSide, BackSide } from "react-flippy";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Carousel from "react-slick";

// Import images directly
import bank1 from "../images/coming.webp";
import bank2 from "../images/coming.webp";
import bank3 from "../images/coming.webp";
import bank4 from "../images/coming.webp";
import bank5 from "../images/coming.webp";
import bank6 from "../images/coming.webp";
import bank7 from "../images/coming.webp";
import bank8 from "../images/coming.webp";

const Coming = () => {
  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 960,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  const sponsors = [
    { image: bank1 },
    { image: bank2 },
    { image: bank3 },
    { image: bank4 },
    { image: bank5 },
    { image: bank6 },
    { image: bank7 },
    { image: bank8 },
  ];

  return (
    <div className="w-full px-4 py-8">
      <h1
        className="text-center font-bold mb-8"
        style={{
          color: "#06a34e",
          fontSize: "30px",
          fontFamily: "Inter, sans-serif",
          marginTop: "50px", // Moves the heading lower on the page
        }}
      >
       Kolte Patil Canvas - Floor Plan

      </h1>
      <div className="relative">
        <Carousel {...carouselSettings}>
          {sponsors.map((sponsor, index) => (
            <Flippy
              key={index}
              flipOnHover={true}
              flipOnClick={true}
              flipDirection="horizontal"
              style={{ width: '300px', height: '300px' }} // Adjusted dimensions to better fit the image
            >
              <FrontSide
                className="flex items-center justify-center h-full bg-gray-100 rounded-lg shadow-md"
                style={{ 
                  border: '4px solid #06a34e',
                  backgroundImage: `url(${sponsor.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
      width: '300px', height: '200px'
                }}
              >
                {/* The same image is shown on the front */}
              </FrontSide>
              <BackSide
                className="flex items-center justify-center h-full bg-gray-100 rounded-lg shadow-md"
                style={{ 
                  border: '4px solid #06a34e',
                  backgroundImage: `url(${sponsor.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                 width: '300px', height: '200px' ,
                  backgroundRepeat: 'no-repeat'
                  

                }}
              >
                {/* The same image is shown on the back */}
              </BackSide>
            </Flippy>
          ))}
        </Carousel>
      </div>
    </div>
  );
};

export default Coming;
