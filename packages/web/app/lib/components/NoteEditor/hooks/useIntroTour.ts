import { useEffect, useRef, RefObject } from 'react';
import { getCookie, setCookie } from '../utils/noteHelpers';

interface IntroTourRefs {
  titleRef: RefObject<HTMLInputElement | null>;
  deleteRef: RefObject<HTMLButtonElement | null>;
  dateRef: RefObject<HTMLDivElement | null>;
  locationRef: RefObject<HTMLDivElement | null>;
}

export const useIntroTour = (refs: IntroTourRefs) => {
  const introStartedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if intro has already been shown
    const hasAddNoteIntroBeenShown = getCookie('addNoteIntroShown');
    if (hasAddNoteIntroBeenShown) return;

    // Use timeout instead of MutationObserver - more predictable timing
    const timeoutId = setTimeout(async () => {
      if (introStartedRef.current) return;

      const addNote = document.getElementById('add-note-button');
      const title = refs.titleRef.current;
      const deleteButton = refs.deleteRef.current;
      const date = refs.dateRef.current;
      const location = refs.locationRef.current;

      // Graceful degradation: if elements not ready, skip tour
      if (!addNote || !title || !deleteButton || !date || !location) {
        return;
      }

      introStartedRef.current = true;

      const introJs = (await import('intro.js')).default;
      const intro = introJs.tour();

      const handleTourComplete = () => {
        setCookie('addNoteIntroShown', 'true', 365);
      };

      intro.setOptions({
        steps: [
          {
            element: addNote,
            intro: 'Click this button to add a note',
          },
          {
            element: title,
            intro: 'You can name your note here!',
          },
          {
            element: deleteButton,
            intro: "If you don't like your note, you can delete it here.",
          },
          {
            element: date,
            intro: 'We will automatically date and time your entry!',
          },
          {
            element: location,
            intro: 'Make sure you specify the location of your note.',
          },
        ],
        scrollToElement: false,
        skipLabel: 'Skip',
      });

      intro.oncomplete(handleTourComplete);
      intro.onexit(handleTourComplete);

      intro.start();
    }, 1000); // Wait 1s for React to finish rendering

    return () => clearTimeout(timeoutId);
  }, [refs.titleRef, refs.deleteRef, refs.dateRef, refs.locationRef]);
};
