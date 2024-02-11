import React, { useState, useEffect } from "react";
import Image from "next/image";
import background from '../public/background.jpg'; // Make sure the path matches where you saved your image


const Page = () => {
    return (
      <div className="font-sans leading-6">
        {/* Section with culture.jpg */}
        <div className="bg-cover bg-center bg-no-repeat min-h-screen" style={{ backgroundImage: 'url("/culture.jpg")' }}>
          <header className="py-4 mb-8 text-center">
            <h1 className="text-5xl font-bold text-black">
              About Us
            </h1>
          </header>
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
        <div className="bg-cover bg-center bg-no-repeat min-h-screen" style={{ backgroundImage: 'url("/festival.jpg")' }}>
          {/* You can add additional content or leave it just as a visual section */}
        </div>
  
        {/* Additional content section */}
        {/* Team section */}
       {/* Team section */}
       <main className="max-w-4xl mx-auto px-4 bg-white bg-opacity-80 py-16">
        <div className="text-center py-16">
          <h2 className="text-4xl font-bold mb-8">
            The Team
          </h2>
          <p className="mb-8">
            Our project team is based out of Saint Louis University. Working together, our collaborations help organize a variety of public forums, exhibits, conferences, pedagogical resources, research support, and digital publications.
          </p>
          
          {/* Team Lead */}
          <div className="flex justify-center mb-8">
            <div>
              <img
                className="w-32 h-32 rounded-full mx-auto"
                src="/yash.jpg" // Path to Yash Bhatia's image
                alt="Yash Bhatia"
              />
              <p className="mt-2 font-semibold">Yash Bhatia - Tech Lead</p>
            </div>
          </div>

          {/* Team Members */}
          <div className="grid grid-cols-3 gap-10 justify-items-center">
            {/* Josh Hogan */}
            <div>
              <img
                className="w-32 h-32 rounded-full"
                src="/F-22.jpg" // Path to Josh Hogan's image
                alt="Josh Hogan"
              />
              <p className="mt-2 font-semibold">Josh Hogan</p>
            </div>
            
            {/* Izak Robles */}
            <div>
              <img
                className="w-32 h-32 rounded-full"
                src="/Izak.jpg" // Path to Izak Robles's image
                alt="Izak Robles"
              />
              <p className="mt-2 font-semibold">Izak Robles</p>
            </div>

            {/* Stuart Ray */}
            <div>
              <img
                className="w-32 h-32 rounded-full"
                src="/Stuart.jpg" // Path to Stuart Ray's image
                alt="Stuart Ray"
              />
              <p className="mt-2 font-semibold">Stuart Ray</p>
            </div>
          </div>
          
          <button className="bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded mt-8">
            About Us
          </button>
        </div>
      </main>

  
        {/* Section with study.jpg */}
        <div className="bg-cover bg-center bg-no-repeat min-h-screen" style={{ backgroundImage: 'url("/study.jpg")' }}>
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