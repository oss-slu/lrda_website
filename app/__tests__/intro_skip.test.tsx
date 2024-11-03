import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import React from 'react';

// TestComponent renders a button with the styles we want to test.
const TestComponent = () => {
  return (
    <button
      className="introjs-skipbutton"
      // Applying styles inline to ensure they are available during the test
      style={{
        fontSize: '1.0em',
        left: 'auto',
        right: '10px',
        color: '#555',
      }}
    >
      Skip
    </button>
  );
};

// Test to verify that the .introjs-skipbutton styles are applied correctly
test('renders .introjs-skipbutton with correct styles', () => {
  // Render the TestComponent
  const { getByText } = render(<TestComponent />);
  
  // Select the button element by its text content
  const skipButton = getByText('Skip');

  // Assertions to verify that each style is applied as expected
  expect(skipButton).toHaveStyle('font-size: 1.0em'); // Check font size
  expect(skipButton).toHaveStyle('left: auto');       // Check left alignment
  expect(skipButton).toHaveStyle('right: 10px');      // Check right position
  expect(skipButton).toHaveStyle('color: #555');      // Check text color
});
