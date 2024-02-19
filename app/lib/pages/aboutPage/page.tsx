"use client"
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import background from '../public/background.jpg'; 


const teamImages = [
    '/aboutPageImages/Scrolling/one.jpg',
    '/aboutPageImages/Scrolling/two.jpg',
    '/aboutPageImages/Scrolling/three.jpg',
    '/aboutPageImages/Scrolling/four.jpg',
    '/aboutPageImages/Scrolling/five.jpg',
    '/aboutPageImages/Scrolling/six.jpg',
    '/aboutPageImages/Scrolling/seven.jpg',
    '/aboutPageImages/Scrolling/eight.jpg',
  ];

  const Page = () => {
    // Settings for the slider
    const settings = {
      dots: true,
      infinite: true,
      speed: 800,
      slidesToShow: 3, 
      slidesToScroll: 1,
      autoplay: true,
      autoplaySpeed: 7000,
      cssEase: "linear"
    };
  
    
    return (
<div className="font-sans leading-6">
  {/* Section with culture.jpg */}
  <div className="relative bg-cover bg-center bg-no-repeat min-h-screen" style={{ backgroundImage: 'url("/aboutPageImages/culture.jpg")' }}>
    <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="text-center text-white p-10 max-w-xl">
        <h1 className="text-5xl font-bold mb-4">
          Where is Religion in The Digital Age?
        </h1>
        <p className="mb-4">
          Seeking to better understand the sights, sounds, tastes, rituals, beliefs, and overall experiences of religion in the everyday lives of practitioners.
        </p>
        <a href="https://religioninplace.org/blog/wheres-religion/#:~:text=Where's%20Religion%3F%20is%20conceptualized%20and,and%20cultural%20diversity%20at%20scale." target="_blank" rel="noopener noreferrer">
  <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4">
    Learn More
  </button>
</a>
        <div> {/* Container for logos */}
        <a href="https://www.instagram.com/livedreligion/" target="_blank" rel="noopener noreferrer">
         <img
              src="/instagram.jpg" 
              alt="Instagram"
               className="h-8 mx-2 inline-block" 
           />
         </a>
        <a href="https://twitter.com/livedreligion" target="_blank" rel="noopener noreferrer">
          <img
          src="/X.jpg" 
          alt="Twitter"
          className="h-8 mx-2 inline-block" 
        />
           </a>

        </div>
      </div>
    </div>
  </div>
    
  
        {/* Main content section */}
        <main className="max-w-4xl mx-auto px-4 bg-white bg-opacity-80 py-16">
          <section className="mb-8">
            <h2 className="text-4xl font-bold">
              Our Mission
            </h2>
            <p>
              *This will be updated with Dr. Park's input.*
            </p>
          </section>
  
          <section className="mb-8">
            <h2 className="text-4xl font-bold">
              What We Do
            </h2>
            <p>
            *This will be updated with Dr. Park's input.*
            </p>
          </section>
  
          <section className="mb-8">
            <h2 className="text-4xl font-bold">
              Who We Are
            </h2>
            <p>
            *This will be updated with Dr. Park's input.*
            </p>
          </section>
        </main>
  
        {/* Section with festival.jpg */}
        <div className="bg-cover bg-center bg-no-repeat min-h-screen" style={{ backgroundImage: 'url("/aboutPageImages/festival.jpg")' }}>
          {/* You can add additional content or leave it just as a visual section */}
        </div>
  
        {/* Additional content section */}
       {/* Team section */}
      <main className="max-w-4xl mx-auto px-4 bg-white bg-opacity-80 py-16">
        <div className="text-center py-16">
          <h2 className="text-4xl font-bold mb-8">
            The Team
          </h2>
          <p className="mb-8">
          Driven by the vision of Dr. Adam Park, our dynamic team at Saint Louis University is united by a shared passion for exploring and understanding the diverse landscape of religion. With a spirit of innovation and collaboration, we are dedicated to creating engaging public forums, immersive exhibits, and comprehensive pedagogical resources. Our multifaceted approach includes organizing conferences, offering research support, and producing thought-provoking digital publications, all aimed at enriching the discourse on religion's role in society.
          </p>
          
          {/* Team Lead */}
          <div className="flex justify-center mb-8">
  <div className="hover:scale-110 transition-transform duration-300">
    <img
      className="w-32 h-32 rounded-full mx-auto"
      src="/aboutPageImages/Yash.jpg"
      alt="Yash Bhatia"
    />
    <p className="mt-2 font-semibold">Yash Bhatia</p>
    <p className="mt-2 font-semibold">Tech Lead</p>
  </div>
</div>

{/* Team Members */}
<div className="grid grid-cols-3 gap-10 justify-items-center">
  {/* Josh Hogan */}
  <div className="hover:scale-110 transition-transform duration-300">
    <img
      className="w-32 h-32 rounded-full"
      src="/aboutPageImages/F-22.jpg"
      alt="Josh Hogan"
    />
    <p className="mt-2 font-semibold">Josh Hogan</p>
    <p className="mt-2 font-semibold">Developer</p>
  </div>
  
  {/* Izak Robles */}
  <div className="hover:scale-110 transition-transform duration-300">
    <img
      className="w-32 h-32 rounded-full"
      src="/aboutPageImages/Izak.jpg"
      alt="Izak Robles"
    />
    <p className="mt-2 font-semibold">Izak Robles</p>
    <p className="mt-2 font-semibold">Developer</p>
  </div>

  {/* Stuart Ray */}
  <div className="hover:scale-110 transition-transform duration-300">
    <img
      className="w-32 h-32 rounded-full"
      src="/aboutPageImages/Stuart.jpg"
      alt="Stuart Ray"
    />
    <p className="mt-2 font-semibold">Stuart Ray</p>
    <p className="mt-2 font-semibold">Developer</p>
  </div>
</div>
        </div>

       {/* Horizontally scrolling gallery with react-slick */}
       <div className="max-w-4xl mx-auto px-4 py-16">
        <Slider {...settings}>
          {teamImages.map((image, index) => (
            <div key={index}>
              <img
                src={image}
                alt={`Gallery image ${index + 1}`}
                style={{ width: '100%', height: 'auto' }} // Adjust the height and width as needed
              />
            </div>
          ))}
        </Slider>
      </div>

      </main>
      <div className="relative bg-cover bg-center bg-no-repeat min-h-screen" style={{ backgroundImage: 'url("/aboutPageImages/study.jpg")' }}>
  <div className="absolute inset-0 flex justify-center items-center">
    <div className="bg-gray-200 text-black p-4 max-w-lg mx-auto rounded" style={{ backgroundColor: 'rgba(211, 211, 211, 0.8)', maxWidth: '90%' }}>
      <p className="text-xl font-semibold">
        "Culture or civilization, taken in its wide ethnographic sense, is that complex whole which includes knowledge, belief, art, morals, law, custom, and any other capabilities and habits acquired by man as a member of society."
      </p>
      <p className="text-right">
        - Edward B. Tylor, Primitive Culture 1871
      </p>
    </div>
  </div>
</div>
  
        {/* Footer or final content section */}
        <footer className="w-full py-16 bg-white-100"> 
  <div className="flex items-center justify-between mx-auto px-10 max-w-7xl space-x-20"> 
  <a href="https://religioninplace.org/blog/" target="_blank" rel="noopener noreferrer">
      <img 
        src="/LivedReligion.png" 
        alt="Lived Religion in the Digital Age"
        className="object-cover h-56 w-auto" 
      />
    </a>
    <a href="https://oss-slu.github.io/" target="_blank" rel="noopener noreferrer">
  <img 
    src="/OpenSourceWithSLU.png" 
    alt="Open Source with SLU"
    className="object-cover h-56 w-auto" 
  />
</a>
<a href="https://www.slu.edu/science-and-engineering/index.php" target="_blank" rel="noopener noreferrer">
  <img 
    src="/three.jpg" 
    alt="Third Image"
    className="object-cover h-72 w-auto" 
  />
</a>
  </div>
</footer>
      </div>
    );
  };
  
  export default Page;