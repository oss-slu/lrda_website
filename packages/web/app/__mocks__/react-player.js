// Mock for react-player package
import React from 'react';

const ReactPlayer = ({ url, src, ...props }) => {
  return React.createElement(
    'div',
    { 'data-testid': 'react-player', ...props },
    'Mock ReactPlayer',
  );
};

ReactPlayer.displayName = 'ReactPlayer';

export default ReactPlayer;
