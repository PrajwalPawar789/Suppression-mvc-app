import React from "react";
import footer1 from "../images/footer1.webp";
import footer2 from "../images/footer2.webp";

const Footer = () => {
  return (
    <footer >
      <div className="container mx-auto text-center">
        <div className="flex justify-center mb-4">
          <img
            src={footer1}
            alt="Logo"
            className="w-60 h-auto" // Adjust the width as needed
          />
        </div>
        <div className="flex justify-center mb-4">
          <img
            src={footer2}
            alt="Logo"
            className="w-60 h-auto" // Adjust the width as needed
          />
        </div>
       
        <div className="text-sm mb-4 text-black">
          <p style={{
            color: "black",
            fontFamily: "Inter, sans-serif",
            fontSize: "12px",
          }}>
            Disclaimer: The content is for information purposes only and does not constitute an offer to avail of any service. Prices mentioned are subject to change without notice and properties mentioned are subject to availability. Images for representation purposes only. This is the official website of the authorized marketing partner. We may share data with RERA registered brokers/companies for further processing. We may also send updates to the mobile number/email ID registered with us. All Rights Reserved.
          </p>
          <br/>
          <p style={{
            color: "black",
            fontFamily: "Inter, sans-serif",
            fontSize: "12px",
          }}>Agent Maharera: A52100019166</p>
        </div>
      </div>
      <div>

        
      </div>
    </footer>
  );
};

export default Footer;
