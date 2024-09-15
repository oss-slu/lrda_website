import { useEffect } from 'react';
import introJs from 'intro.js';
import 'intro.js/introjs.css';

const IntroGuide = () => {
  useEffect(() => {
    const intro = introJs();
    intro.setOptions({
      steps: [
        {
          element: '#add-notes-button',
          intro: 'Click here to add a new note.',
          position: 'right'
        },
        // Add more steps as needed
      ]
    });

    // Check if it's the user's first login
    const isFirstLogin = localStorage.getItem('firstLogin') === null;
    if (isFirstLogin) {
      intro.start();
      localStorage.setItem('firstLogin', 'false');
    }
  }, []);

  return null;
};

export default IntroGuide;