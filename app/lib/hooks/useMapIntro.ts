"use client";

import { useEffect, useRef } from "react";

interface UseMapIntroProps {
  searchBarRef: React.RefObject<HTMLDivElement | null>;
  notesListRef: React.RefObject<HTMLDivElement | null>;
  noteRefs: React.MutableRefObject<{ [key: string]: HTMLElement | undefined }>;
}

/**
 * Hook to manage the intro.js tutorial for first-time users.
 */
export function useMapIntro({ searchBarRef, notesListRef, noteRefs }: UseMapIntroProps) {
  const introStartedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Reset on mount to allow intro to run if conditions are met
    introStartedRef.current = false;

    const observer = new MutationObserver(async () => {
      // Prevent multiple initializations
      if (introStartedRef.current) return;

      const navbarCreateNoteButton = document.getElementById("navbar-create-note");
      const navbarLogoutButton = document.getElementById("navbar-logout");

      if (searchBarRef.current && navbarCreateNoteButton && noteRefs && notesListRef.current) {
        // Check if the intro has been shown before (from cookies)
        const introShown = document.cookie
          .split("; ")
          .find((row) => row.startsWith("introShown="))
          ?.split("=")[1];

        // If intro was already shown, just disconnect and return
        if (introShown) {
          observer.disconnect();
          return;
        }

        // Mark as started immediately to prevent race conditions
        introStartedRef.current = true;
        observer.disconnect();

        // Dynamically import intro.js only on client side
        const introJs = (await import("intro.js")).default;
        const intro = introJs.tour();

        intro.setOptions({
          steps: [
            {
              element: (noteRefs.current as any)?.current,
              intro: "Welcome! Let's explore the website together.",
            },
            {
              element: searchBarRef.current,
              intro: "First, here's the search bar. You can use it to help you find locations on the map.",
            },
            {
              element: notesListRef.current,
              intro: "Now, this is the notes list. You can use it to explore other people's notes!",
            },
            {
              element: navbarCreateNoteButton,
              intro: "Click here to create your own note!",
            },
            {
              element: navbarLogoutButton,
              intro: "Done for the day? Make sure to logout!",
            },
          ],
          scrollToElement: true,
          skipLabel: "Skip",
        });

        const setIntroShownCookie = () => {
          document.cookie = "introShown=true; path=/; max-age=31536000"; // 1 year expiry
        };

        intro.oncomplete(setIntroShownCookie);
        intro.onexit(setIntroShownCookie);

        intro.start();

        // Style the skip button after rendering
        setTimeout(() => {
          const skipButton = document.querySelector(".introjs-skipbutton") as HTMLElement;
          if (skipButton) {
            skipButton.style.position = "absolute";
            skipButton.style.top = "2px";
            skipButton.style.right = "20px";
            skipButton.style.fontSize = "18px";
            skipButton.style.padding = "4px 10px";
          }
        }, 100);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, [searchBarRef, noteRefs, notesListRef]);
}
