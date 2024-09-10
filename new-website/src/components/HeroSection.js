import React from 'react';
import web from "../images/hero.webp";
import AboutSection from './AboutSection ';
import AboutSection1 from './AboutSection1';
import MasterPlan from './MasterPlan';
import Map from './Map';
import Faq from './Faq';
import Slider from './Slider';
import Footer from './Footer';
import Footer2 from './Footer2';
import Imagegrid from './Imagegrid';
import Coming from './Coming';
import ImageDisplay from './ImageDisplay';
import YouTubeVideo from './YouTubeVideo';
import BoxesWithImages from './BoxesWithImages';


const HeroSection = () => {
  return (
    <>
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 py-8" >
        <h1 className="text-4xl font-bold mb-6" style={{ color: '#06a34e', fontFamily: 'Inter, sans-serif' }}>
          Kolte patil canvas - ON Spot Offer
        </h1>

        <img
          src={web}
          alt="Hero Section"
          className="max-w-full max-h-full"
        />



      </div>
      <AboutSection />
      <Imagegrid/>
      <AboutSection1 />
      <ImageDisplay/>
      <YouTubeVideo/>
      <BoxesWithImages/>
      <Coming/>
      <MasterPlan/>
      <Map/>
      <Faq/>
      <Slider/>
      <Footer/>
      <Footer2/>
    </>

  );
};

export default HeroSection;
