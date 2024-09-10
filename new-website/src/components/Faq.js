import React, { useState } from 'react';

// FAQ Data
const faqData = [
  {
    question: "Who is Kolte Patil?",
    answer: "Kolte Patil Developers is a leading real estate company based in Pune, Maharashtra, established in 1991. They are known for developing residential, commercial, and retail projects with a focus on innovation, quality, and sustainability."
  },
  {
    question: "What are the major projects developed by Kolte Patil?",
    answer: "Some of the major projects by Kolte Patil Developers include Life Republic in Pune, 24K Sereno, Kolte Patil Western Avenue, Ivy Estate, and City Avenue. These projects range from luxury residential complexes to integrated townships and commercial spaces."
  },
  {
    question: "Where are Kolte Patil Developers' projects located?",
    answer: "Kolte Patil Developers have projects in key cities across India, including Pune, Mumbai, and Bengaluru. Pune remains their primary market, with several prominent developments in and around the city."
  },
  {
    question: "Where is Life Republic Canvas located?",
    answer: "Life Republic Canvas is located in Hinjewadi, Pune, within the 400-acre Life Republic Township. This location is strategically positioned near major IT parks, educational institutions, hospitals, and retail centers, making it an ideal choice for residents seeking a balanced lifestyle."
  },
  {
    question: "What types of apartments are available at Life Republic Canvas?",
    answer: "Life Republic Canvas offers spacious 3 BHK, 3.5 BHK, and 4 BHK residences, each designed with modern amenities and expansive layouts to provide comfort, luxury, and style."
  },
  {
    question: "What are the key amenities available at Life Republic Canvas?",
    answer: "The project boasts over 65 luxury amenities, including the largest swimming pool in the vicinity, two spas, a two-acre podium, a sky bridge connecting all towers, fitness plazas, coworking spaces, and much more, ensuring a high-quality lifestyle for its residents."
  },
  {
    question: "What makes Life Republic Canvas unique compared to other residential projects in Pune?",
    answer: "Life Republic Canvas stands out for its spacious apartment layouts, the highest rising towers in the vicinity, designed by the renowned architect Hafeez Contractor, and a large percentage of open and amenity spaces. The project also features unique architectural elements like a sky bridge connecting the towers and one of the largest balconies in the area."
  },
  {
    question: "What is the expected possession date for Life Republic Canvas?",
    answer: "The expected possession date for Life Republic Canvas is not explicitly mentioned. Buyers are advised to contact Kolte Patil Developers directly or consult the official RERA registration for the most accurate information regarding possession timelines."
  },
  {
    question:"How is the connectivity of Life Republic Canvas with other parts of Pune?",
    answer: "Life Republic Canvas offers excellent connectivity to major parts of Pune, including a 6-minute drive to the NH4 Highway. The project is also close to prominent IT parks, schools, hospitals, and retail centers, making daily commutes and access to essential services convenient."
  },
  {
    question: "Is Life Republic Canvas RERA registered?",
    answer: "Yes, Life Republic Canvas is RERA registered, ensuring that the project complies with all regulatory requirements, providing transparency and security to buyers. The RERA registration number can be obtained from the official Kolte Patil Developers website or by contacting their sales team."
  },
  {
    question: "What is the price range for apartments in Life Republic Canvas?",
    answer: "The price range for apartments in Life Republic Canvas varies depending on the apartment size and layout. Prospective buyers are encouraged to contact Kolte Patil Developers directly for the most up-to-date pricing information and available payment plans."
  },
];

const Faq = () => {
  // State to track which section is open
  const [openIndex, setOpenIndex] = useState(null);

  // Function to toggle the visibility of the content
  const toggleSection = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
    <h1
        className="text-center font-bold mb-8"
        style={{
          color: "#06a34e",
          fontSize: "30px",
          fontFamily: "Inter, sans-serif",
          marginTop: "50px", // Moves the heading lower on the page
        }}
      >
     FAQs - Kolte Patil Canvas
      </h1> 
    <div className="w-full max-w-4xl mx-auto bg-white p-6 border rounded-lg shadow-lg">
      {/* Heading */}
 {/* Centered Heading */}
    

      {faqData.map((item, index) => (
        <div key={index} className="mb-6">
          {/* Toggle Button */}
          <button
            onClick={() => toggleSection(index)}
            className="flex items-center  w-full text-gray-700 font-semibold p-3 bg-[#06a34e] text-white rounded-lg hover:bg-[#048a3d] transition"
          >
            <span>{openIndex === index ? '-' : '+'}</span>
            <span className="ml-2 text-left">{item.question}</span>
          </button>

          {/* Collapsible Content */}
          {openIndex === index && (
            <div className="mt-4 p-4 border-t border-gray-300">
              <p>{item.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
    </>
  );
};

export default Faq;
