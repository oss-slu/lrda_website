import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import RegisterButton from "../lib/components/register_button";

test('it renders a button with the correct text', () => {
  const { getByText } = render(<RegisterButton />);
  
  // Check if the button with the text 'Register' is rendered
  const registerButton = getByText('Register');
  expect(registerButton).toBeInTheDocument();
});

test('it handles click event', () => {
  const { getByText } = render(<RegisterButton />);
  const registerButton = getByText('Register');

  // Simulate a click event on the button
  fireEvent.click(registerButton);

  // Add your assertion for the click event if needed
});
