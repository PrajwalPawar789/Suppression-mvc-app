import React from "react";
import image1 from "../images/img2.webp"; // Replace with your image
import image2 from "../images/img2.webp"; // Replace with your image
import image3 from "../images/swing.png"; // Replace with your image
import image4 from "../images/jacuzzi.png"; // Replace with your image
import image22 from "../images/bonfire.png"; // Replace with your image
import image35 from "../images/dance.png";
import image40 from "../images/dance.png";
import image28 from "../images/grass.png";
import image24 from "../images/beach-cabana.png";
import image32 from "../images/jacuzzi.png";
import backgroundImage from "../images/POOL-01-2-1-scaled.jpg"; // Replace with your background image
import image33 from "../images/swing.png";
import image27 from "../images/toys.png";
import image39 from "../images/spa.png";
import image5 from "../images/swing.png";
import image6 from "../images/toys.png";
import image7 from "../images/spa.png";
import image8 from "../images/grass.png";
import image9 from "../images/beach-cabana.png";
import image10 from "../images/jacuzzi.png";
import image23 from "../images/jacuzzi.png";
import image11 from "../images/bonfire.png"; // Replace with your image
import image12 from "../images/dance.png";
import image19 from "../images/dance.png";
import image14 from "../images/spa.png";
import image15 from "../images/swing.png";
import image16 from "../images/toys.png";
import image17 from "../images/spa.png";
import image18 from "../images/grass.png";
import image21 from "../images/beach-cabana.png";
import image20 from "../images/spa.png";
import image13 from "../images/swing.png";
import image25 from "../images/toys.png";
import image26 from "../images/spa.png";

import image29 from "../images/img2.webp"; // Replace with your image
import image30 from "../images/swing.png"; // Replace with your image
import image31 from "../images/jacuzzi.png"; // Replace with your image
import image34 from "../images/bonfire.png";
import image36 from "../images/toys.png";
import image37 from "../images/spa.png";
import image38 from "../images/grass.png";

const BoxesWithImages = () => {
  const boxData = [
    { img: image1, text: "Fitness Plaza" },
    { img: image2, text: "Yoga & Zumba" },
    { img: image3, text: "Indoor Games" },
    { img: image4, text: "Water Feature" },
    { img: image5, text: "Jogging Track" },
    { img: image6, text: "Salon Space" },
    { img: image7, text: "Learning Room" },
    { img: image8, text: "Music Room" },
    { img: image9, text: "Reading Room" },
    { img: image10, text: "Gathering Hall" },
    { img: image11, text: "Creche" },
    { img: image12, text: "Courtside Club" },
    { img: image13, text: "Jogging Track" },
    { img: image14, text: "Featured Pavilions" },
    { img: image15, text: "Floating Cabana" },
    { img: image16, text: "Seating Area" },
    { img: image17, text: "Padel Tennis" },
    { img: image18, text: "Skating Rink" },
    { img: image19, text: "Indoor Squash Court" },
    { img: image20, text: "Pickle Ball Court" },
    { img: image21, text: "Guest Suite" },
    { img: image22, text: "Bonfire Court" },
    { img: image23, text: "Coworking Space" },
    { img: image24, text: "Social Pods" },
    { img: image25, text: "Pool Deck" },
    { img: image26, text: "Media Room" },
    { img: image27, text: "Kid's Play Area" },
    { img: image28, text: "Lawn" },
    { img: image29, text: "Half Basketball Court" },
    { img: image30, text: "Pet Park" },
    { img: image31, text: "Infinity Edge Lap Pool" },
    { img: image32, text: "Jacuzzi" },
    { img: image33, text: "Swing Pavilion" },
    { img: image34, text: "Rejuvenate" },
    { img: image35, text: "Dance Hall" },
    { img: image36, text: "Cricket Practice Net" },
    { img: image37, text: "Four Square Court" },
    { img: image38, text: "Indoor - Badminton Court" },
    { img: image39, text: "Four Square Court" },
    { img: image40, text: "Half Basketball Court" },
  ];

  return (
    <div
      className="container mx-auto py-8"
      style={{
        backgroundImage: `url(${backgroundImage})`, // Background image
        backgroundSize: "cover", // Ensures the background covers the entire section
        backgroundPosition: "center", // Centers the background
        backgroundRepeat: "no-repeat", // Prevents the background from repeating
      }}
    >
      <h1
        className="text-center font-bold mb-8"
        style={{
          color: "white",
          fontSize: "30px",
          fontFamily: "Inter, sans-serif",
          marginTop: "50px", // Moves the heading lower on the page
        }}
      >
        KOLTE PATIL CANVAS - AMENITIES
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {boxData.map((box, index) => (
          <div
            key={index}
            className="bg-white shadow-md rounded-lg overflow-hidden p-2 flex flex-col items-center"
            style={{ width: "150px", height: "120px" }} // Adjusted size of the boxes
          >
            <img
              src={box.img}
              alt={`Box ${index + 1}`}
              className="w-12 h-15 object-cover mb-2 rounded-md" // Smaller image
            />
            <p className="text-center text-gray-700 text-lg font-bold">
              {box.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BoxesWithImages;
