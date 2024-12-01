"use client";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import React from "react";
import Image from "next/image";

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
      {/* Section with background image */}
      <div
        className="relative bg-cover bg-center bg-no-repeat min-h-screen"
        style={{ backgroundImage: 'url("/aboutPageImages/background.jpg")' }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="text-center text-white p-10 max-w-xl">
            <h1 className="text-5xl font-bold mb-4">
             <p>Where's Religion </p>
            </h1>
            <a
              href="https://religioninplace.org/blog/wheres-religion/#:~:text=Where's%20Religion%3F%20is%20conceptualized%20and,and%20cultural%20diversity%20at%20scale."
              target="_blank"
              rel="noopener noreferrer"
            >
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4">
                Learn More
              </button>
            </a>
            <div>
              <a
                href="https://www.instagram.com/livedreligion/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="/instagram.jpg"
                  alt="Instagram"
                  className="h-8 mx-2 inline-block"
                />
              </a>
              <a
                href="https://twitter.com/livedreligion"
                target="_blank"
                rel="noopener noreferrer"
              >
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
    <h2 className="text-4xl font-bold">About</h2>
    <br />
    <p className="text-lg font-normal leading-7">
      Where’s Religion? is an open-source application developed by humanities faculty and IT professionals at Saint Louis University that supports in-person research, remote data entry, media sharing, and mapping. The app is designed to facilitate a more robust public understanding of religion through rigorous scholarly methods. Our conviction is that the study of religion must account for the wide range of embodied experiences, improvised practices, material cultures, and shared spaces that humans inhabit. Through a research methodology that moves beyond analysis of sacred texts, creeds, and official teachings, Where’s Religion? provides a platform to diversify the data we study and to advance the study of religion we all encounter in everyday life.
    </p>
    <br />
    <p className="text-lg font-normal leading-7">
      Where’s Religion? is a keystone outcome of the Center on Lived Religion at Saint Louis University. We have received external support from the Henry Luce Foundation ($400,000 in 2018 and $470,000 in 2022), and internal support from the College of Arts & Sciences, the Office for the Vice President for Research and the Research Computing Group, Open Source with SLU, the Walter J. Ong, S.J., Center for Digital Humanities, and the CREST Research Center (Culture, Religion, Ethics, Science, Technology).
    </p>
  </section>
</main>

      {/* Team Section */}
      <main className="max-w-4xl mx-auto px-4 bg-white bg-opacity-80 py-16">
        <div className="text-center py-16">
          <h2 className="text-4xl font-bold mb-8">The Saint Louis University Where's Religion Team</h2>

          {/* Initiative Team Section */}
          <div className="grid grid-cols-2 gap-10 justify-items-center mb-12">
            {/* Rachel Lindsey */}
            <div className="flex flex-col items-center hover:scale-110 transition-transform duration-300">
              <Image
                src="/aboutPageImages/Rachel.jpg"
                alt="Rachel Lindsey"
                width={128}
                height={128}
                className="rounded-full"
              />
              <p className="mt-4 font-semibold text-center">Rachel Lindsey</p>
              <p className="font-semibold text-center">Director of Center on Lived Religion</p>
            </div>

            {/* Adam Park */}
            <div className="flex flex-col items-center hover:scale-110 transition-transform duration-300">
              <Image
                src="/aboutPageImages/Adam.jpg"
                alt="Adam Park"
                width={128}
                height={128}
                className="rounded-full"
              />
              <p className="mt-4 font-semibold text-center">Adam Park</p>
              <p className="font-semibold text-center">Associate Director of Research (COLR)</p>
            </div>

            {/* Pauline Lee */}
            {/* <div className="flex flex-col items-center hover:scale-110 transition-transform duration-300">
              <Image
                src="/aboutPageImages/Pauline.jpg"
                alt="Pauline Lee"
                width={128}
                height={128}
                className="rounded-full"
              />
              <p className="mt-4 font-semibold text-center">Pauline Lee</p>
              <p className="font-semibold text-center">Associate Director of Public Humanities (COLR)</p>
            </div> */}
            {/* Yash Bhatia */}
            {/* <div className="flex flex-col items-center hover:scale-110 transition-transform duration-300">
              <Image
                src="/aboutPageImages/Yash.jpg"
                alt="Yash Bhatia"
                width={128}
                height={128}
                className="rounded-full"
              />
              <p className="mt-4 font-semibold text-center">Yash Bhatia</p>
              <p className="font-semibold text-center">Software Engineer&Tech Lead</p>
            </div> */}
          </div>
          <h2 className="text-4xl font-bold mb-8">The Development Team</h2>

          {/* Tech Team Members */}
          <div className="grid grid-cols-3 gap-10 justify-items-center">

          {/* Yash Bhatia */}
          <div className="flex flex-col items-center hover:scale-110 transition-transform duration-300">
              <Image
                src="/aboutPageImages/Yash.jpg"
                alt="Yash Bhatia"
                width={128}
                height={128}
                className="rounded-full"
              />
              <p className="mt-4 font-semibold text-center">Yash Bhatia</p>
              <p className="font-semibold text-center">Software Engineer and Tech Lead</p>
              <div className="flex mt-2 space-x-4">
                {/* GitHub Icon */}
                  <a href="https://github.com/yashb196" target="_blank" rel="noopener noreferrer">
                      <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 496 512">
                          <path d="M248 8C111 8 0 119 0 256c0 110.3 71.3 203.9 170.5 237.2 12.5 2.3 17.1-5.4 17.1-12v-42.3c-69.4 15.1-83.8-33.6-83.8-33.6-11.4-28.9-27.8-36.6-27.8-36.6-22.7-15.5 1.7-15.2 1.7-15.2 25.1 1.8 38.3 25.8 38.3 25.8 22.3 38.2 58.5 27.2 72.8 20.8 2.2-16.1 8.7-27.2 15.8-33.5-55.4-6.3-113.6-27.7-113.6-123.2 0-27.2 9.7-49.4 25.6-66.8-2.6-6.3-11.1-31.8 2.5-66.2 0 0 21-6.7 68.7 25.6a237.1 237.1 0 01125.2 0c47.6-32.3 68.6-25.6 68.6-25.6 13.7 34.4 5.2 59.9 2.6 66.2 16 17.4 25.6 39.6 25.6 66.8 0 95.7-58.4 116.8-113.9 123 8.9 7.7 16.8 22.9 16.8 46.2v68.4c0 6.7 4.6 14.3 17.2 11.9C424.8 459.9 496 366.3 496 256 496 119 385 8 248 8z"/>
                      </svg>
                  </a>
                  {/* LinkedIn Icon */}
                  <a href="https://www.linkedin.com/in/yashbhatia238/" target="_blank" rel="noopener noreferrer">
                      <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 448 512">
                          <path d="M100.28 448H7.4V148.9h92.88zm-46.1-329.72a53.62 53.62 0 11-53.62-53.62 53.62 53.62 0 0153.61 53.61zM447.9 448h-92.68V305.69c0-33.89-12.13-57.08-42.35-57.08-23.11 0-36.86 15.55-42.91 30.59-2.2 5.39-2.74 12.9-2.74 20.48V448H174.69s1.24-269 0-297h92.68v42.06a91 91 0 0183.26-45.84c60.84 0 106.38 39.68 106.38 124.86z"/>
                      </svg>
                  </a>
              </div>
            </div>

          <div className="flex flex-col items-center hover:scale-110 transition-transform duration-300">
              <Image
                src="/aboutPageImages/Patrick.jpg"
                alt="Patrick Cuba"
                width={128}
                height={128}
                className="rounded-full"
              />
              <p className="mt-4 font-semibold text-center">Patrick Cuba</p>
              <p className="font-semibold text-center">IT Architect</p>
            </div>

            <div className="flex flex-col items-center hover:scale-110 transition-transform duration-300">
              <Image
                src="/aboutPageImages/Bryan.jpg"
                alt="Bryan Haberberger"
                width={128}
                height={128}
                className="rounded-full"
              />
              <p className="mt-4 font-semibold text-center">Bryan Haberberger</p>
              <p className="font-semibold text-center">Full Stack Developer</p>
            </div>
         
            {/* Josh Hogan */}
            {/* <div className="flex flex-col items-center hover:scale-110 transition-transform duration-300">
              <Image
                src="/aboutPageImages/F-22.jpg"
                alt="Josh Hogan"
                width={128}
                height={128}
                className="rounded-full"
              />
              <p className="mt-4 font-semibold text-center">Josh Hogan</p>
              <p className="font-semibold text-center">Developer</p>
            </div> */}

            {/* Izak Robles */}
            <div className="flex flex-col items-center hover:scale-110 transition-transform duration-300">
              <Image
                src="/aboutPageImages/Izak.jpg"
                alt="Izak Robles"
                width={128}
                height={128}
                className="rounded-full"
              />
              <p className="mt-4 font-semibold text-center">Izak Robles</p>
              <p className="font-semibold text-center">Developer</p>
            </div>

            {/* Stuart Ray */}
            <div className="flex flex-col items-center hover:scale-110 transition-transform duration-300">
              <Image
                src="/aboutPageImages/Stuart.jpg"
                alt="Stuart Ray"
                width={128}
                height={128}
                className="rounded-full"
              />
              <p className="mt-4 font-semibold text-center">Stuart Ray</p>
              <p className="font-semibold text-center">Developer</p>
            </div>

            {/* Zanxiang Wang */}
            <div className="flex flex-col items-center hover:scale-110 transition-transform duration-300">
                <div className="overflow-hidden rounded-full w-32 h-32"> {/* Container for circular crop */}
                    <Image
                      src="/aboutPageImages/Zanxiang.jpg"
                      alt="Zanxiang Wang"
                      width={128}
                      height={128}
                      className="object-cover" // Ensures the image fills the container
                    />
                </div>
                <p className="mt-4 font-semibold text-center">Zanxiang Wang</p>
                <p className="font-semibold text-center">Tech Lead</p>
                <div className="flex mt-2 space-x-4">
                    {/* GitHub Icon */}
                    <a href="https://github.com/BaloneyBoy97" target="_blank" rel="noopener noreferrer">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 496 512">
                            <path d="M248 8C111 8 0 119 0 256c0 110.3 71.3 203.9 170.5 237.2 12.5 2.3 17.1-5.4 17.1-12v-42.3c-69.4 15.1-83.8-33.6-83.8-33.6-11.4-28.9-27.8-36.6-27.8-36.6-22.7-15.5 1.7-15.2 1.7-15.2 25.1 1.8 38.3 25.8 38.3 25.8 22.3 38.2 58.5 27.2 72.8 20.8 2.2-16.1 8.7-27.2 15.8-33.5-55.4-6.3-113.6-27.7-113.6-123.2 0-27.2 9.7-49.4 25.6-66.8-2.6-6.3-11.1-31.8 2.5-66.2 0 0 21-6.7 68.7 25.6a237.1 237.1 0 01125.2 0c47.6-32.3 68.6-25.6 68.6-25.6 13.7 34.4 5.2 59.9 2.6 66.2 16 17.4 25.6 39.6 25.6 66.8 0 95.7-58.4 116.8-113.9 123 8.9 7.7 16.8 22.9 16.8 46.2v68.4c0 6.7 4.6 14.3 17.2 11.9C424.8 459.9 496 366.3 496 256 496 119 385 8 248 8z"/>
                        </svg>
                    </a>
                    {/* LinkedIn Icon */}
                    <a href="https://www.linkedin.com/in/zanxiang-wang-352b112a0/" target="_blank" rel="noopener noreferrer">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 448 512">
                            <path d="M100.28 448H7.4V148.9h92.88zm-46.1-329.72a53.62 53.62 0 11-53.62-53.62 53.62 53.62 0 0153.61 53.61zM447.9 448h-92.68V305.69c0-33.89-12.13-57.08-42.35-57.08-23.11 0-36.86 15.55-42.91 30.59-2.2 5.39-2.74 12.9-2.74 20.48V448H174.69s1.24-269 0-297h92.68v42.06a91 91 0 0183.26-45.84c60.84 0 106.38 39.68 106.38 124.86z"/>
                        </svg>
                    </a>
                </div>
            </div>
          {/* Amy Chen */}
          <div className="flex flex-col items-center hover:scale-110 transition-transform duration-300">
                <div className="overflow-hidden rounded-full w-32 h-32"> {/* Container for circular crop */}
                    <Image
                      src="/aboutPageImages/Amy.jpg"
                      alt="Amy Chen"
                      width={128}
                      height={128}
                      className="object-cover" // Ensures the image fills the container
                    />
                </div>
                <p className="mt-4 font-semibold text-center">Amy Chen</p>
                <p className="font-semibold text-center">Developer</p>
                <div className="flex mt-2 space-x-4">
                    {/* GitHub Icon */}
                    <a href="https://github.com/amychen108" target="_blank" rel="noopener noreferrer">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 496 512">
                            <path d="M248 8C111 8 0 119 0 256c0 110.3 71.3 203.9 170.5 237.2 12.5 2.3 17.1-5.4 17.1-12v-42.3c-69.4 15.1-83.8-33.6-83.8-33.6-11.4-28.9-27.8-36.6-27.8-36.6-22.7-15.5 1.7-15.2 1.7-15.2 25.1 1.8 38.3 25.8 38.3 25.8 22.3 38.2 58.5 27.2 72.8 20.8 2.2-16.1 8.7-27.2 15.8-33.5-55.4-6.3-113.6-27.7-113.6-123.2 0-27.2 9.7-49.4 25.6-66.8-2.6-6.3-11.1-31.8 2.5-66.2 0 0 21-6.7 68.7 25.6a237.1 237.1 0 01125.2 0c47.6-32.3 68.6-25.6 68.6-25.6 13.7 34.4 5.2 59.9 2.6 66.2 16 17.4 25.6 39.6 25.6 66.8 0 95.7-58.4 116.8-113.9 123 8.9 7.7 16.8 22.9 16.8 46.2v68.4c0 6.7 4.6 14.3 17.2 11.9C424.8 459.9 496 366.3 496 256 496 119 385 8 248 8z"/>
                        </svg>
                    </a>
                    {/* LinkedIn Icon */}
                    <a href="https://www.linkedin.com/in/amy-chen-0a1232258/" target="_blank" rel="noopener noreferrer">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 448 512">
                            <path d="M100.28 448H7.4V148.9h92.88zm-46.1-329.72a53.62 53.62 0 11-53.62-53.62 53.62 53.62 0 0153.61 53.61zM447.9 448h-92.68V305.69c0-33.89-12.13-57.08-42.35-57.08-23.11 0-36.86 15.55-42.91 30.59-2.2 5.39-2.74 12.9-2.74 20.48V448H174.69s1.24-269 0-297h92.68v42.06a91 91 0 0183.26-45.84c60.84 0 106.38 39.68 106.38 124.86z"/>
                        </svg>
                    </a>
                </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Section */}
      {/* <footer className="w-full py-16 bg-white-100">
        <div className="flex items-center justify-between mx-auto px-10 max-w-7xl space-x-20">
          <a href="https://religioninplace.org/blog/" target="_blank" rel="noopener noreferrer">
            <img src="/LivedReligion.png" alt="Lived Religion in the Digital Age" className="object-cover h-56 w-auto" />
          </a>
          <a href="https://oss-slu.github.io/" target="_blank" rel="noopener noreferrer">
            <img src="/OpenSourceWithSLU.png" alt="Open Source with SLU" className="object-cover h-56 w-auto" />
          </a>
          <a href="https://www.slu.edu/science-and-engineering/index.php" target="_blank" rel="noopener noreferrer">
            <img src="/three.jpg" alt="Third Image" className="object-cover h-72 w-auto" />
          </a>
        </div>
      </footer> */}
    </div>
  );
};

export default Page;