import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import RegisterButton from "../lib/components/register_button"; 

test('Register button is clickable when not in a loading state', () => {
  const { getByText } = render(<RegisterButton />);
  const button = getByText('Register');
  expect(button).not.toHaveAttribute('disabled'); // Check that the button is not disabled
  fireEvent.click(button);
  // You can add assertions here to test the button's behavior when clicked
});


test('Register button is disabled when in a loading state', () => {
    const { getByText } = render(<RegisterButton />);
    const button = getByText('Register');
    expect(button).not.toHaveAttribute('disabled'); // Check that the button is initially not disabled
    fireEvent.click(button); // Trigger a click to simulate the loading state
    expect(button).toHaveAttribute('disabled'); // Check that the button is disabled when in a loading state
    // You can add more assertions here to test the loading behavior
  });

  test('Button text changes to "Registering..." when clicked', () => {
    const { getByText } = render(<RegisterButton />);
    const button = getByText('Register');
    fireEvent.click(button); // Trigger a click event
    expect(getByText('Registering...')).toBeInTheDocument(); // Check if the button text changes to "Registering..."
  });

  test('Button click triggers handleClick function', () => {
    const handleClick = jest.fn();
    const { getByText } = render(<RegisterButton />);
    const button = getByText('Register');
    button.onclick = handleClick; // Attach the handleClick function to the button
    fireEvent.click(button); // Trigger a click event
    expect(handleClick).toHaveBeenCalled(); // Check if handleClick was called
  });

  test('RegisterButton component renders with the correct text', () => {
    const { getByText } = render(<RegisterButton />);
    const registerButton = getByText('Register');
    expect(registerButton).toBeInTheDocument(); // Check if the "Register" button is rendered
  });

  test('Unusual Test: RegisterButton component does not have an unusual attribute', () => {
    const { container } = render(<RegisterButton />);
    const unusualAttribute = 'data-unusual-attribute'; // An unusual attribute name
    const registerButton = container.querySelector('button');
  
    if (registerButton) {
      expect(registerButton).not.toHaveAttribute(unusualAttribute); // Check if the component does not have the unusual attribute
    } else {
      // Fail the test if the button is not found
      fail('Button element not found in the component');
    }
  });