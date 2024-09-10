import React, { useState } from "react";
import logo from "../images/logo.svg";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <img className="h-12 w-auto" src={logo} alt="Logo" />
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8">
            <a
              href="#about"
              className="text-black-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              style={{ fontSize: "15px" }}
            >
              ABOUT
            </a>
            <a
              href="#pricing"
              className="text-black-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              style={{ fontSize: "15px" }}
            >
              PRICE
            </a>
            <a
              href="#gallery"
              className="text-black-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              style={{ fontSize: "15px" }}
            >
              GALLERY
            </a>
            <a
              href="#amenities"
              className="text-black-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              style={{ fontSize: "15px" }}
            >
              AMENITIES
            </a>
            <a
              href="#unit-plan"
              className="text-black-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              style={{ fontSize: "15px" }}
            >
              UNIT PLAN
            </a>
            <a
              href="#location"
              className="text-black-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              style={{ fontSize: "15px" }}
            >
              LOCATION
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-black-300 hover:text-gray-700 focus:outline-none"
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
                  d="M4 6h16M4 12h16M4 18h16"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Items */}
        <div
          className={`fixed inset-0 bg-white bg-opacity-95 flex flex-col items-center justify-center space-y-6 z-50 transition-all duration-300 ease-in-out ${
            isOpen ? "block" : "hidden"
          }`}
        >
          <button
            onClick={toggleMenu}
            className="absolute top-4 right-4 text-gray-700"
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
          <a
            href="#about"
            className="text-black text-lg font-medium hover:text-gray-700 transition duration-150"
            onClick={toggleMenu}
          >
            ABOUT
          </a>
          <a
            href="#pricing"
            className="text-black text-lg font-medium hover:text-gray-700 transition duration-150"
            onClick={toggleMenu}
          >
            PRICE
          </a>
          <a
            href="#gallery"
            className="text-black text-lg font-medium hover:text-gray-700 transition duration-150"
            onClick={toggleMenu}
          >
            GALLERY
          </a>
          <a
            href="#amenities"
            className="text-black text-lg font-medium hover:text-gray-700 transition duration-150"
            onClick={toggleMenu}
          >
            AMENITIES
          </a>
          <a
            href="#unit-plan"
            className="text-black text-lg font-medium hover:text-gray-700 transition duration-150"
            onClick={toggleMenu}
          >
            UNIT PLAN
          </a>
          <a
            href="#location"
            className="text-black text-lg font-medium hover:text-gray-700 transition duration-150"
            onClick={toggleMenu}
          >
            LOCATION
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
