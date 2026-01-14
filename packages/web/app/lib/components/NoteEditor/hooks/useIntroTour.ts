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

    const observer = new MutationObserver(async () => {
      if (introStartedRef.current) return;

      const addNote = document.getElementById('add-note-button');
      const title = refs.titleRef.current;
      const deleteButton = refs.deleteRef.current;
      const date = refs.dateRef.current;
      const location = refs.locationRef.current;

      if (addNote && title && deleteButton && date && location) {
        const hasAddNoteIntroBeenShown = getCookie('addNoteIntroShown');

        if (hasAddNoteIntroBeenShown) {
          observer.disconnect();
          return;
        }

        introStartedRef.current = true;
        observer.disconnect();

        const introJs = (await import('intro.js')).default;
        const intro = introJs.tour();

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

        intro.oncomplete(() => {
          setCookie('addNoteIntroShown', 'true', 365);
        });

        intro.onexit(() => {
          setCookie('addNoteIntroShown', 'true', 365);
        });

        intro.start();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [refs.titleRef, refs.deleteRef, refs.dateRef, refs.locationRef]);
};
