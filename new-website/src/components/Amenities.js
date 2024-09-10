import React from 'react';
import image1 from "../images/Cubhouse.PNG";
import image2 from "../images/Meditation.PNG";
import image3 from "../images/Indoor.PNG";
import image4 from "../images/Kids.PNG";
import image6 from "../images/GYM.PNG";
import image7 from "../images/openspace.PNG";
import image8 from "../images/Power.PNG";
import image9 from "../images/Rain.PNG";
import image10 from "../images/Car.PNG";
import image11 from "../images/multipurpose.PNG";
import image12 from "../images/Videosecurity.PNG";
import image13 from "../images/24security.PNG";
import image14 from "../images/Jogging.PNG";
import image15 from "../images/tennis.PNG";
import image5 from "../images/Swimming.PNG";



const amenities = [

{ image: image1, name: "Clubhouse" },
{ image: image2, name: "Meditation Center" },
{ image: image3, name: "Indoor Games" },
{ image: image4, name: "Kids Play Area" },
{ image: image5, name: "Swimming Pool" },
{ image: image6, name: "Gym" },
{ image: image7, name: "Open Space" },
{ image: image8, name: "Power Backup" },
{ image: image9, name: "Rain Water Harvesting" },
{ image: image10, name: "Car Parking" },,
{ image: image11, name: "Multipurpose Hall" },
{ image: image12, name: "Video Security" },
{ image: image13, name: "24/7 Security" },
{ image: image14, name: "Jogging Track" },
{ image: image15, name: "Tennis Court" },


];

const Amenities = () => {
  return (
    <div className="max-w-7xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6" style={{ color: '#06a34e', textAlign: 'center' }}>The Perfect Amenities</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {amenities.map((amenity, index) => (
          <div key={index} className="flex flex-col items-center text-center">
            <img
              src={amenity.image}
              alt={amenity.name}
              className="w-24 h-24 object-cover mb-2 rounded-lg shadow-md"
            />
            <p className="text-lg font-medium">{amenity.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Amenities;
