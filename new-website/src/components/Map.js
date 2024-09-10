import React from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

// Google Maps API Key
const API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';

// Map container styling
const containerStyle = {
  width: '100%',
  height: '400px',
};

// Location: Hinjewadi, Pune 411057 (Latitude and Longitude)
const center = {
  lat: 18.5912,
  lng: 73.7380,
};

const Map = () => {
  return (
    <div className="flex flex-col items-center justify-center">
      {/* Centered Heading */}
      <h1
        className="text-center font-bold mb-8"
        style={{
          color: "#06a34e",
          fontSize: "30px",
          fontFamily: "Inter, sans-serif",
          marginTop: "50px", // Moves the heading lower on the page
        }}
      >
        Kolte Patil Canvas - Location Advantage

      </h1>

      {/* Google Map */}
      <LoadScript googleMapsApiKey={API_KEY}>
        <div className="w-full">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={14}
          >
            {/* Marker at Hinjewadi */}
            <Marker position={center} />
          </GoogleMap>
        </div>
      </LoadScript>
    </div>
  );
};

export default Map;
