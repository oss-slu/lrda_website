import { useEffect, useRef } from 'react';

interface UseMapIntroProps {
  searchBarRef: React.RefObject<HTMLDivElement | null>;
  notesListRef: React.RefObject<HTMLDivElement | null>;
}

export function useMapIntro({ searchBarRef, notesListRef }: UseMapIntroProps) {
  const introStartedRef = useRef(false);

  useEffect(() => {
    if (introStartedRef.current) return;

    const introShown = document.cookie
      .split('; ')
      .find(row => row.startsWith('introShown='))
      ?.split('=')[1];
    if (introShown) return;

    // Wait one frame for layout to settle, then check elements
    const rafId = requestAnimationFrame(async () => {
      if (introStartedRef.current) return;

      const searchBar = searchBarRef.current;
      const notesList = notesListRef.current;
      const navbarCreateNoteButton = document.getElementById('navbar-create-note');

      if (!searchBar || !notesList || !navbarCreateNoteButton) return;

      introStartedRef.current = true;

      const { loadIntroStyles } = await import('@/utils/loadIntroStyles');
      await loadIntroStyles();
      const introJs = (await import('intro.js')).default;
      const intro = introJs.tour();

      const steps: { element?: HTMLElement; intro: string }[] = [
        {
          intro: "Welcome! Let's explore the website together.",
        },
        {
          element: searchBar,
          intro:
            "First, here's the search bar. You can use it to help you find locations on the map.",
        },
        {
          element: notesList,
          intro: "Now, this is the notes list. You can use it to explore other people's notes!",
        },
        {
          element: navbarCreateNoteButton,
          intro: 'Click here to create your own note!',
        },
      ];

      const navbarLogoutButton = document.getElementById('navbar-logout');
      if (navbarLogoutButton) {
        steps.push({
          element: navbarLogoutButton,
          intro: 'Done for the day? Make sure to logout!',
        });
      }

      intro.setOptions({
        steps,
        scrollToElement: true,
        skipLabel: 'Skip',
      });

      const setIntroShownCookie = () => {
        document.cookie = 'introShown=true; path=/; max-age=31536000';
      };

      intro.oncomplete(setIntroShownCookie);
      intro.onexit(setIntroShownCookie);

      intro.start();
    });

    return () => cancelAnimationFrame(rafId);
  }, [searchBarRef, notesListRef]);
}
