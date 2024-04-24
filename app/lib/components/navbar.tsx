"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { User } from "../models/user_class";
import { Button } from "@/components/ui/button";
import introJs from 'intro.js';
import 'intro.js/introjs.css';
import '../../globals.css';





const user = User.getInstance();

export default function Navbar() {
  const [name, setName] = useState<string | null>(null);
  
  
  const handleLogout = async () => {
    try {
      await user.logout();
      localStorage.removeItem(name || "");

      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  useEffect(() => {
    const fetchName = async () => {
      try {
        const userName = await user.getName();
        setName(userName);

        if (userName) {
          const item = localStorage.getItem(userName);
          if (item) {
            await user.login(userName, item);
          }
        }
      } catch (error) {
        console.log("No user cached or login failed");
      }
    };

    fetchName();
  }, []);

  /* Commented out to bypass the tour check
  useEffect(() => {
    user.hasCompletedTour().then((completed) => {
      if (!completed) {
        startTour(); // Start the tour if it hasn't been completed
      }
    });
  }, []);
  */


  const startTour = () => {
    // Determine the current page or route
    const currentPage = window.location.pathname;
  
    // Check the current page and start the corresponding tour
    if (currentPage === "/lib/pages/map") {
      startMapTour();
    } else if (currentPage === "/lib/pages/notes" || currentPage === "/lib/pages/aboutPage") {
      startNoteComponentTour();
    } else {
      // Default behavior or error handling if the page doesn't match any tour
      console.error("No tour available for this page");
    }
  };


  const startMapTour = () => {
    const tour = introJs();
    tour.setOptions({
      steps: [
        {
          intro: "Welcome to Where's Religion Desktop! Lets take a quick tour of the Explore page.",
          tooltipClass: 'customTooltipClass'
        },
        {
          element: '#tourStepSearchBar',
          intro: 'Use this search bar to quickly find notes based on their content or location. You can search for anything from note titles to tags or even note contents.',
          position: 'bottom',
          tooltipClass: 'customTooltipClass'
        },

        {
          element: '#userInteractionIcons',
          intro: 'Here you can toggle between global or personal notes, and manage your user settings. Each icon represents a different function, helping you customize your viewing experience.',
          position: 'right',
          tooltipClass: 'customTooltipClass'
        },

        {
          element: '#globeIcon',
          intro: 'Switching to global will display notes in a 100 miles radius on the right panel. Let\'s try it! Switch between the global and the user icon and notice how the notes displayed on the right side change.',
          position: 'right',
          tooltipClass: 'introjs-step-global-switch'  // Custom class for styling if needed
        },
        {
          element: '#userIcon',
          intro: 'Switching to this icon will only display your notes on the right panel. Make sure to switch back and forth twice.',
          position: 'right',
          tooltipClass: 'introjs-step-user-switch'  // Custom class for styling if needed
        },

        {
          element: '#mapContainer',
          intro: "This is the map area where you can interact with the map features.",
          tooltipClass: 'customTooltipClass'
        },
        {
          element: '#notesSection',
          intro: 'Your created notes or other uses notes will be displayed here based on your selection.',
          tooltipClass: 'customTooltipClass'
        },
     
        {
          
          intro: "Tour complete. Restart any time by clicking 'Tour' on the NavBar.",
          tooltipClass: 'customTooltipClass'
        }
        // Additional steps can be added here
      ],
      showProgress: true,
    showBullets: false,
    exitOnOverlayClick: false,
    exitOnEsc: true,
    nextLabel: 'Next >',
    prevLabel: '< Back',
    doneLabel: 'Finish',
    skipLabel: '×', 
    tooltipClass: 'customTooltipClass',
    });

    tour.onexit(() => {
      console.log("Tour was exited");
      // Perform any necessary cleanup or state updates here
    });
  
    tour.oncomplete(() => {
      console.log("Tour completed successfully");
      user.setTourCompleted(); // Mark the tour as completed
      // Perform any final actions once the tour is completed
    });
  
    tour.start();
  };

  const startNoteComponentTour = () => {
    const tour = introJs();
    tour.setOptions({
      steps: [
        {
          intro: "Welcome! Let's quickly explore the note editor.",
          tooltipClass: 'customTooltipClass'
        },
        {
          element: '#tourStepSearchBar',
          intro: "Find notes fast using this search bar.",
          tooltipClass: 'customTooltipClass'
        },
        {
          element: '#addNoteButton',
          intro: "Click here to add a new note or refresh the editor.",
          tooltipClass: 'customTooltipClass'
        },

        {
          element: '#noteTitleInput',
          intro: "Enter your note's title here.",
          tooltipClass: 'customTooltipClass'
        },
        {
          element: '#noteToolbar',
          intro: "This toolbar has all your note tools. Let's check them out.",
          tooltipClass: 'customTooltipClass'
        },
        {
          element: '#publishToggle',
          intro: "Switch this to make your note public or keep it private.",
          tooltipClass: 'customTooltipClass'
        },
        {
          element: '#saveButton',
          intro: "Save your note regularly here.",
          tooltipClass: 'customTooltipClass'
        },
        {
          element: '#deleteButton',
          intro: "Delete your note with caution—there's no undo.",
          tooltipClass: 'customTooltipClass'
        },
        {
          element: '#timePicker',
          intro: "Set your note's time for scheduling or organization.",
          tooltipClass: 'customTooltipClass'
        },
        {
          element: '#locationPicker',
          intro: "Pin a location to your note here.",
          tooltipClass: 'customTooltipClass'
        },
        {
          element: '#videoComponent',
          intro: "Enhance notes with videos here.",
          tooltipClass: 'customTooltipClass'
        },
        {
          element: '#audioButton',
          intro: "Add audio recordings to your note here.",
          tooltipClass: 'customTooltipClass'
        },
        {
          element: '#tagManager',
          intro: "Organize your notes using tags here.",
          tooltipClass: 'customTooltipClass'
        },
        {
          element: '#richTextEditor',
          intro: "This is your main writing and editing area. Style your text, add images, and more.",
          tooltipClass: 'customTooltipClass'
        },
        {
          
          intro: "Tour complete. Restart any time by clicking 'Start Tour'.",
          tooltipClass: 'customTooltipClass'
        }
        // Conclusion or further instructions...
      ],
      showProgress: true,
    showBullets: false,
    exitOnOverlayClick: false,
    exitOnEsc: true,
    nextLabel: 'Next >',
    prevLabel: '< Back',
    doneLabel: 'Finish',
    skipLabel: '×', 
    tooltipClass: 'customTooltipClass',
    });

      tour.oncomplete(() => user.setTourCompleted());
      tour.onexit(() => user.setTourCompleted());
  
    tour.start();
  };

  

  return (
    <nav className="bg-gray-900 w-full h-[10vh] flex flex-row justify-between items-center px-6 py-3 text-white">
      <div className="flex w-full justify-start">
      <Link legacyBehavior href="/" passHref>
        <a id="createNoteButton" className="text-2xl font-bold text-blue-300 hover:text-blue-500 transition duration-300 ease-in-out mr-4">
        Where's Religion
        </a>
      </Link>

        {name ? (
          <Link legacyBehavior href="/lib/pages/notes" passHref>
            <a className="text-2xl font-bold text-blue-300 hover:text-blue-500 transition duration-300 ease-in-out mr-4">
              Create
            </a>
          </Link>
        ) : null}

        { <Link legacyBehavior href="/lib/pages/aboutPage" passHref>
          <a className="text-2xl font-bold text-blue-300 hover:text-blue-500 transition duration-300 ease-in-out mr-2">
            About
          </a>
        </Link> }

        <Button
        onClick={startTour}
         style={{ marginTop: '-2px' }}
        className="text-2xl font-bold text-blue-300 hover:text-blue-500 transition duration-300 ease-in-out mr-2"
        >
        Tour
        </Button>

        <Link legacyBehavior href="/lib/pages/map" passHref>
          <a className="text-2xl font-bold text-blue-300 hover:text-blue-500 transition duration-300 ease-in-out mr-4">
            Explore
          </a>
        </Link>
    
        </div>
      
      <div className="">
        {name ? (
          <div className="flex items-center gap-6 w-full">
            <span
              className="text-lg font-semibold min-w-max truncate max-w-[150px] hover:underline cursor-pointer"
              title={name}
            >
              Hi, {name}!
            </span>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 border border-blue-700 rounded shadow"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => (window.location.href = "/lib/pages/loginPage")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 border border-blue-700 rounded shadow"
          >
            Login
          </Button>
        )}
      </div>
    </nav>
  );
}
