import React, { useState } from 'react';
import image1 from "../images/2bhk.webp"; // Importing the local 2BHK image
import image2 from "../images/flat3.webp";
import image3 from "../images/3Bhk.webp";
import image4 from "../images/flat4.webp";

const MasterPlan = () => {
  const [selectedPlan, setSelectedPlan] = useState('2BHK');

  const plans = {
    '2BHK': {
      image: image1, // Using the local image1 for 2BHK
      carpetArea: '1000 sq. ft.',
      price: '₹50,00,000',
    },
    '3BHK': {
      image: image2, // Local image for 3BHK
      carpetArea: '1500 sq. ft.',
      price: '₹75,00,000',
    },
    '4BHK': {
      image: image3, // Local image for 4BHK
      carpetArea: '2000 sq. ft.',
      price: '₹1,00,00,000',
    },
    'Master Plan': {
      image: image4, // Local image for Master Plan
      carpetArea: 'Overall Layout',
      price: 'Pricing as per units',
    },
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      {/* Heading with color and left alignment */}
      <h2 className="text-3xl font-bold mb-6" style={{ color: '#06a34e', textAlign: 'left' }}>
        Unit Plan and Master Plan
      </h2>

      {/* Buttons */}
      <div className="flex justify-center space-x-4 mb-10">
        {Object.keys(plans).map((plan) => (
          <button
            key={plan}
            onClick={() => setSelectedPlan(plan)}
            className={`${
              selectedPlan === plan ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
            } px-4 py-2 rounded-md text-sm font-medium transition duration-150 hover:bg-blue-500 hover:text-white`}
          >
            {plan}
          </button>
        ))}
      </div>

      {/* Layout and Details */}
      <div className="flex flex-col md:flex-row md:space-x-10 items-center">
        {/* Image */}
        <div className="flex-1">
          <img
            src={plans[selectedPlan].image}
            alt={`${selectedPlan} Layout`}
            className="w-full h-auto rounded-lg shadow-lg"
          />
        </div>

        {/* Carpet Area and Price */}
        <div className="flex-1 mt-6 md:mt-0">
          <div className="bg-gray-100 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-gray-700 mb-4">
              {selectedPlan} - Carpet Area & Price
            </h3>
            <p className="text-gray-600 mb-2">
              <span className="font-semibold">Carpet Area:</span>{' '}
              {plans[selectedPlan].carpetArea}
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Price:</span>{' '}
              {plans[selectedPlan].price}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterPlan;
