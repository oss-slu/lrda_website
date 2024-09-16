import 'intro.js/introjs.css';
import introJs from 'intro.js';

export const startIntro = (searchBarRef, noteListRef) => {
  const intro = introJs();
  intro.setOptions({
    steps: [
      {
        element: searchBarRef.current,
        intro: "This is the search bar. Use it to find locations or notes."
      },
      {
        element: noteListRef.current,
        intro: "These are your notes. You can interact with them here."
      }
    ]
  });
  intro.start();
};
