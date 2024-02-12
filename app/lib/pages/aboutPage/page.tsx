"use client"
import React, { useState, useEffect } from "react";
import Image from "next/image";
import background from '../public/background.jpg'; // Make sure the path matches where you saved your image

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
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
    useEffect(() => {
      const intervalId = setInterval(() => {
        setCurrentImageIndex((currentImageIndex) => (currentImageIndex + 1) % teamImages.length);
      }, 3000); // Change image every 3 seconds
  
      return () => clearInterval(intervalId); // Clean up on unmount
    }, []);

    return (
      <div className="font-sans leading-6">
        {/* Section with culture.jpg */}
        <div className="relative bg-cover bg-center bg-no-repeat min-h-screen" style={{ backgroundImage: 'url("/aboutPageImages/culture.jpg")' }}>
          <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-end items-center">
            <div className="text-left text-white p-10 max-w-xl ml-auto"> {/* Text is now left aligned and container is pushed to the right */}
              <h1 className="text-5xl font-bold mb-4">
                Where is Religion in The Digital Age?
              </h1>
              <p className="mb-4">
                Seeking to better understand the sights, sounds, tastes, rituals, beliefs, and overall experiences of religion in the everyday lives of practitioners.
              </p>
              
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Learn More
              </button>
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
              Our mission is to explore the intersection of religion and the public sphere, examining how faith traditions shape and are shaped by the modern world.
            </p>
          </section>
  
          <section className="mb-8">
            <h2 className="text-4xl font-bold">
              What We Do
            </h2>
            <p>
              We offer insights through articles, research, and community dialogue, providing a platform for a deeper understanding of religious diversity.
            </p>
          </section>
  
          <section className="mb-8">
            <h2 className="text-4xl font-bold">
              Who We Are
            </h2>
            <p>
              We're a team of scholars, writers, and community leaders passionate about promoting religious literacy and interfaith engagement.
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
            <div>
              <img
                className="w-32 h-32 rounded-full mx-auto"
                src="/aboutPageImages/yash.jpg" // Updated path to Yash Bhatia's image
                alt="Yash Bhatia"
              />
              <p className="mt-2 font-semibold">Yash Bhatia</p>
              <p className="mt-2 font-semibold">Tech Lead</p>
            </div>
          </div>

          {/* Team Members */}
          <div className="grid grid-cols-3 gap-10 justify-items-center">
            {/* Josh Hogan */}
            <div>
              <img
                className="w-32 h-32 rounded-full"
                src="/aboutPageImages/F-22.jpg" // Updated path to Josh Hogan's image
                alt="Josh Hogan"
              />
              <p className="mt-2 font-semibold">Josh Hogan</p>
              <p className="mt-2 font-semibold">Developer</p>
            </div>
            
            {/* Izak Robles */}
            <div>
              <img
                className="w-32 h-32 rounded-full"
                src="/aboutPageImages/Izak.jpg" // Updated path to Izak Robles's image
                alt="Izak Robles"
              />
              <p className="mt-2 font-semibold">Izak Robles</p>
              <p className="mt-2 font-semibold">Developer</p>
            </div>

            {/* Stuart Ray */}
            <div>
              <img
                className="w-32 h-32 rounded-full"
                src="/aboutPageImages/Stuart.jpg" // Updated path to Stuart Ray's image
                alt="Stuart Ray"
              />
              <p className="mt-2 font-semibold">Stuart Ray</p>
              <p className="mt-2 font-semibold">Developer</p>
            </div>
          </div>
          
          <button className="bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded mt-8">
            About Us
          </button>
        </div>

      {/* Auto-cycling image gallery */}
      <div className="mt-8">
            {teamImages.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Gallery image ${index + 1}`}
                className={`mx-auto transition-opacity duration-500 ease-in-out ${currentImageIndex === index ? 'opacity-100' : 'opacity-0'}`}
                style={{ maxHeight: '200px' }} // Adjust the size as needed
              />
            ))}
          </div>
      </main>


      


  
        {/* Section with study.jpg */}
        <div className="bg-cover bg-center bg-no-repeat min-h-screen" style={{ backgroundImage: 'url("/aboutPageImages/study.jpg")' }}>
          {/* You can add additional content or leave it just as a visual section */}
        </div>
  
        {/* Footer or final content section */}
        <footer className="max-w-4xl mx-auto px-4 py-16">
          {/* Footer content goes here */}
        </footer>
      </div>
    );
  };
  
  export default Page;