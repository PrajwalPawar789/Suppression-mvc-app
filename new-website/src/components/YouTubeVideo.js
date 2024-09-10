import React from "react";

const YouTubeVideo = () => {
  return (
    <div className="flex flex-col items-center justify-center py-8 bg-gray-100">
      {/* Heading */}
      <h1
        className="text-center font-bold mb-8"
        style={{
          color: "#06a34e",
          fontSize: "30px",
          fontFamily: "Inter, sans-serif",
          marginTop: "50px", // Moves the heading lower on the page
        }}
      >
        PROJECT VIDEO - KOLTE PATIL CANVAS

      </h1>
      
      {/* Embedded YouTube Video */}
      <div className="w-full max-w-2xl aspect-w-16 aspect-h-9">
        <iframe
          className="w-full h-full"
          src="https://www.youtube.com/" // Replace with your video link
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};

export default YouTubeVideo;
