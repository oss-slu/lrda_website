import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import React from "react";
import Image from "next/image";
import { GitHubLogoIcon, LinkedInLogoIcon } from "@radix-ui/react-icons";

const Page = () => {
  return (
    <div className="font-sans leading-6 h-full overflow-auto">
      {/* Section with background image */}
      <div
        className="relative bg-cover bg-center bg-no-repeat h-full"
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
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4">Learn More</button>
            </a>
            <div>
              <a href="https://www.instagram.com/livedreligion/" target="_blank" rel="noopener noreferrer">
                <img src="/instagram.jpg" alt="Instagram" className="h-8 mx-2 inline-block" />
              </a>
              <a href="https://twitter.com/livedreligion" target="_blank" rel="noopener noreferrer">
                <img src="/X.jpg" alt="Twitter" className="h-8 mx-2 inline-block" />
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
            Where’s Religion? is an open-source application developed by humanities faculty and IT professionals at Saint Louis University
            that supports in-person research, remote data entry, media sharing, and mapping. The app is designed to facilitate a more robust
            public understanding of religion through rigorous scholarly methods. Our conviction is that the study of religion must account
            for the wide range of embodied experiences, improvised practices, material cultures, and shared spaces that humans inhabit.
            Through a research methodology that moves beyond analysis of sacred texts, creeds, and official teachings, Where’s Religion?
            provides a platform to diversify the data we study and to advance the study of religion we all encounter in everyday life.
          </p>
          <br />
          <p className="text-lg font-normal leading-7">
            Where’s Religion? is a keystone outcome of the Center on Lived Religion at Saint Louis University. We have received external
            support from the Henry Luce Foundation ($400,000 in 2018 and $470,000 in 2022), and internal support from the College of Arts &
            Sciences, the Office for the Vice President for Research and the Research Computing Group, Open Source with SLU, the Walter J.
            Ong, S.J., Center for Digital Humanities, and the CREST Research Center (Culture, Religion, Ethics, Science, Technology).
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
              <Image src="/aboutPageImages/Rachel.jpg" alt="Rachel Lindsey" width={128} height={128} className="rounded-full" />
              <p className="mt-4 font-semibold text-center">Rachel Lindsey</p>
              <p className="font-semibold text-center">Director of Center on Lived Religion</p>
            </div>
            {/* Adam Park */}
            <div className="flex flex-col items-center hover:scale-110 transition-transform duration-300">
              <Image src="/aboutPageImages/Adam.jpg" alt="Adam Park" width={128} height={128} className="rounded-full" />
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
              <Image src="/aboutPageImages/Yash.jpg" alt="Yash Bhatia" width={128} height={128} className="rounded-full" />
              <p className="mt-4 font-semibold text-center">Yash Bhatia</p>
              <p className="font-semibold text-center">Software Engineer and Tech Lead</p>
              <div className="flex mt-2 space-x-4">
                {/* GitHub Icon */}
                <a href="https://github.com/yashb196" target="_blank" rel="noopener noreferrer">
                  <GitHubLogoIcon className="h-6 w-6" />
                </a>
                {/* LinkedIn Icon */}
                <a href="https://www.linkedin.com/in/yashbhatia238/" target="_blank" rel="noopener noreferrer">
                  <LinkedInLogoIcon className="h-6 w-6" />
                </a>
              </div>
            </div>

            <div className="flex flex-col items-center hover:scale-110 transition-transform duration-300">
              <Image src="/aboutPageImages/Patrick.jpg" alt="Patrick Cuba" width={128} height={128} className="rounded-full" />
              <p className="mt-4 font-semibold text-center">Patrick Cuba</p>
              <p className="font-semibold text-center">IT Architect</p>
            </div>

            <div className="flex flex-col items-center hover:scale-110 transition-transform duration-300">
              <Image src="/aboutPageImages/Bryan.jpg" alt="Bryan Haberberger" width={128} height={128} className="rounded-full" />
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
              <Image src="/aboutPageImages/Izak.jpg" alt="Izak Robles" width={128} height={128} className="rounded-full" />
              <p className="mt-4 font-semibold text-center">Izak Robles</p>
              <p className="font-semibold text-center">Developer</p>
            </div>

            {/* Stuart Ray */}
            <div className="flex flex-col items-center hover:scale-110 transition-transform duration-300">
              <Image src="/aboutPageImages/Stuart.jpg" alt="Stuart Ray" width={128} height={128} className="rounded-full" />
              <p className="mt-4 font-semibold text-center">Stuart Ray</p>
              <p className="font-semibold text-center">Developer</p>
            </div>

            {/* Zanxiang Wang */}
            <div className="flex flex-col items-center hover:scale-110 transition-transform duration-300">
              <div className="overflow-hidden rounded-full w-32 h-32">
                {/* Container for circular crop */}
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
                  <GitHubLogoIcon className="h-6 w-6" />
                </a>
                {/* LinkedIn Icon */}
                <a href="https://www.linkedin.com/in/zanxiang-wang-352b112a0/" target="_blank" rel="noopener noreferrer">
                  <LinkedInLogoIcon className="h-6 w-6" />
                </a>
              </div>
            </div>

            {/* Amy Chen */}
            <div className="flex flex-col items-center hover:scale-110 transition-transform duration-300">
              <div className="overflow-hidden rounded-full w-32 h-32">
                {" "}
                {/* Container for circular crop */}
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
                  <GitHubLogoIcon className="h-6 w-6" />
                </a>
                {/* LinkedIn Icon */}
                <a href="https://www.linkedin.com/in/amy-chen-0a1232258/" target="_blank" rel="noopener noreferrer">
                  <LinkedInLogoIcon className="h-6 w-6" />
                </a>
              </div>
            </div>

            {/* Justin Wang */}
            <div className="flex flex-col items-center hover:scale-110 transition-transform duration-300">
              <div className="overflow-hidden rounded-full w-32 h-32">
                {" "}
                {/* Container for circular crop */}
                <Image
                  src="/aboutPageImages/Justin.jpg"
                  alt="Justin Wang"
                  width={128}
                  height={128}
                  className="object-cover" // Ensures the image fills the container
                />
              </div>
              <p className="mt-4 font-semibold text-center">Justin Wang</p>
              <p className="font-semibold text-center">Developer</p>
              <div className="flex mt-2 space-x-4">
                {/* GitHub Icon */}
                <a href="https://github.com/jwang-101" target="_blank" rel="noopener noreferrer">
                  <GitHubLogoIcon className="h-6 w-6" />
                </a>
                {/* LinkedIn Icon */}
                <a href="https://www.linkedin.com/in/justin-wang-2a67b1295/" target="_blank" rel="noopener noreferrer">
                  <LinkedInLogoIcon className="h-6 w-6" />
                </a>
              </div>
            </div>

            {/* Sam Sheppard */}
            <div className="flex flex-col items-center hover:scale-110 transition-transform duration-300">
              <Image src="/aboutPageImages/Sam.jpg" alt="Sam Sheppard" width={128} height={128} className="rounded-full" />
              <p className="mt-4 font-semibold text-center">Sam Sheppard</p>
              <p className="font-semibold text-center">Developer</p>
            </div>

            {/* Jacob Maynard */}
            <div className="flex flex-col items-center hover:scale-110 transition-transform duration-300">
              <Image src="https://github.com/InfinityBowman.png" alt="Jacob Maynard" width={128} height={128} className="rounded-full" />
              <p className="mt-4 font-semibold text-center">Jacob Maynard</p>
              <p className="font-semibold text-center">Tech Lead</p>
              <div className="flex mt-2 space-x-4">
                {/* GitHub Icon */}
                <a href="https://github.com/InfinityBowman" target="_blank" rel="noopener noreferrer">
                  <GitHubLogoIcon className="h-6 w-6" />
                </a>
                {/* LinkedIn Icon */}
                <a href="https://www.linkedin.com/in/jacob-maynard-283767230/" target="_blank" rel="noopener noreferrer">
                  <LinkedInLogoIcon className="h-6 w-6" />
                </a>
              </div>
            </div>

            {/* Puneet Sontha */}
            <div className="flex flex-col items-center hover:scale-110 transition-transform duration-300">
              <div className="overflow-hidden rounded-full w-32 h-32">
                {/* Container for circular crop */}
                <Image
                  src="/aboutPageImages/Puneet.jpg"
                  alt="Puneet Sontha"
                  width={128}
                  height={128}
                  className="rounded-full" // Ensures the image fills the container
                />
              </div>
              <p className="mt-4 font-semibold text-center">Puneet Sontha</p>
              <p className="font-semibold text-center">Developer</p>
              <div className="flex mt-2 space-x-4">
                {/* GitHub Icon */}
                <a href="https://github.com/PunSon" target="_blank" rel="noopener noreferrer">
                  <GitHubLogoIcon className="h-6 w-6" />
                </a>
                {/* LinkedIn Icon */}
                <a href="https://www.linkedin.com/in/puneet-sontha/" target="_blank" rel="noopener noreferrer">
                  <LinkedInLogoIcon className="h-6 w-6" />
                </a>
              </div>
            </div>

            {/* Muhammad Hashir */}
            <div className="flex flex-col items-center hover:scale-110 transition-transform duration-300">
              <Image src="/aboutPageImages/hashir.jpg" alt="Muhammad Hashir" width={128} height={128} className="rounded-full" />
              <p className="mt-4 font-semibold text-center">Muhammad Hashir</p>
              <p className="font-semibold text-center">Developer</p>
              <div className="flex mt-2 space-x-4">
                {/* GitHub Icon */}
                <a href="https://github.com/mhashir03" target="_blank" rel="noopener noreferrer">
                  <GitHubLogoIcon className="h-6 w-6" />
                </a>
                {/* LinkedIn Icon */}
                <a href="https://www.linkedin.com/in/muhammad-hashir03" target="_blank" rel="noopener noreferrer">
                  <LinkedInLogoIcon className="h-6 w-6" />
                </a>
              </div>
            </div>

            {/* Andres Castellanos */}
            <div className="flex flex-col items-center hover:scale-110 transition-transform duration-300">
              <div className="overflow-hidden rounded-full w-32 h-32">
                {" "}
                {/* Container for circular crop */}
                <Image
                  src="/aboutPageImages/Andres.jpg"
                  alt="Andres Castellanos"
                  width={128}
                  height={128}
                  className="object-cover" // Ensures the image fills the container
                />
              </div>
              <p className="mt-4 font-semibold text-center">Andres Castellanos</p>
              <p className="font-semibold text-center">Developer</p>
              <div className="flex mt-2 space-x-4">
                {/* GitHub Icon */}
                <a href="https://github.com/andycaste2004" target="_blank" rel="noopener noreferrer">
                  <GitHubLogoIcon className="h-6 w-6" />
                </a>
                {/* LinkedIn Icon */}
                <a href="https://www.linkedin.com/in/andres-castellanos-carrillo-536a10331/" target="_blank" rel="noopener noreferrer">
                  <LinkedInLogoIcon className="h-6 w-6" />
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
