"use client"
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import background from '../public/background.jpg'; // Make sure the path matches where you saved your image


// ... rest of your imports and code ...

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
    const scrollRef = useRef<HTMLDivElement>(null);

  
    useEffect(() => {
        const intervalId = setInterval(() => {
          if (scrollRef.current) {
            const currentScroll = scrollRef.current.scrollLeft;
            const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
      
            // Auto-scroll to the start if we've reached the end
            if (currentScroll >= maxScroll) {
              scrollRef.current.scrollLeft = 0;
            } else {
              // Otherwise, scroll a bit more
              scrollRef.current.scrollLeft += 10;
            }
          }
        }, 100); // Adjust the timing to control the speed
      
        return () => clearInterval(intervalId);
      }, []);
  
    
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
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4">
          Learn More
        </button>
        <div> {/* Container for logos */}
          <img
            src="/instagram.jpg" // Replace with your Instagram logo path
            alt="Instagram"
            className="h-8 mx-2 inline-block" // Adjust the size and spacing as needed
          />
          <img
            src="/X.jpg" // Replace with your Twitter logo path
            alt="Twitter"
            className="h-8 mx-2 inline-block" // Adjust the size and spacing as needed
          />
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
      src="/aboutPageImages/yash.jpg"
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

       {/* Horizontally scrolling gallery */}
       <div ref={scrollRef} className="flex overflow-hidden whitespace-nowrap" style={{ gap: '20px' }}>
  {/* Duplicate the set of images to facilitate the loop */}
  {[...teamImages, ...teamImages].map((image, index) => (
    <img 
      key={index} 
      src={image} 
      alt={`Gallery image ${index % teamImages.length + 1}`} 
      className="inline-block h-48" // You can adjust the height here
      style={{ width: 'auto', flex: 'none' }} // width auto for maintaining aspect ratio, flex none to avoid stretching
    />
  ))}
</div>

      </main>

        {/* Section with study.jpg */}
        <div className="bg-cover bg-center bg-no-repeat min-h-screen" style={{ backgroundImage: 'url("/aboutPageImages/study.jpg")' }}>
          {/* You can add additional content or leave it just as a visual section */}
        </div>
  
        {/* Footer or final content section */}
        <footer className="w-full py-16 bg-white-100"> {/* Adjust the background color as needed */}
  <div className="flex items-center justify-between mx-auto px-10 max-w-7xl space-x-20"> {/* Increased space-x-20 for more spacing */}
    <img 
      src="/LivedReligion.png" // Path for the first image
      alt="Lived Religion in the Digital Age"
      className="object-cover h-56 w-auto" // Ensure width auto for maintaining aspect ratio along with height
    />
    <img 
      src="/OpenSourceWithSLU.png" // Path for the second image
      alt="Open Source with SLU"
      className="object-cover h-56 w-auto" // Same as above
    />
    <img 
      src="/three.jpg" // Path for the third image
      alt="Third Image"
      className="object-cover h-72 w-auto" // Larger height if necessary, with width auto
    />
  </div>
</footer>
      </div>
    );
  };
  
  export default Page;