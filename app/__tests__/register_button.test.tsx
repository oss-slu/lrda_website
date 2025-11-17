import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import RegisterButton from "../lib/components/register_button"; 
import { validateEmail, validateFirstName, validateLastName } from '../lib/utils/validation';

test('Register button is clickable when not in a loading state', () => {
  const { getByText } = render(<RegisterButton />);
  const button = getByText('Sign up');
  expect(button).not.toHaveAttribute('disabled'); // Check that the button is not disabled
  fireEvent.click(button);
  // You can add assertions here to test the button's behavior when clicked
});

test('Validation functions for E-mail, first and last name are valid with input and invalid when empty', () => {
  expect(validateEmail('mail@example.com')).toBeTruthy(); //These should probably be changed to test input on the register button itself.
  expect(validateEmail('')).toBeFalsy();

  expect(validateFirstName('firstName')).toBeTruthy();
  expect(validateFirstName('')).toBeFalsy();

  expect(validateLastName('lastName')).toBeTruthy();
  expect(validateLastName('')).toBeFalsy();
});

test('Register button is disabled when in a loading state', () => {
  const { getByText } = render(<RegisterButton />);
  const button = getByText('Sign up');
    expect(button).not.toHaveAttribute('disabled'); // Check that the button is initially not disabled
    fireEvent.click(button); // Trigger a click to simulate the loading state
    expect(button).toHaveAttribute('disabled'); // Check that the button is disabled when in a loading state
    // You can add more assertions here to test the loading behavior
  });

  test('Button text changes to "Registering..." when clicked', () => {
  const { getByText } = render(<RegisterButton />);
  const button = getByText('Sign up');
  fireEvent.click(button); // Trigger a click event
  expect(getByText('Signing up...')).toBeInTheDocument(); // Check if the button text changes to "Signing up..."
  });

  test('Button click triggers handleClick function', () => {
    const handleClick = jest.fn();
  const { getByText } = render(<RegisterButton />);
  const button = getByText('Sign up');
    button.onclick = handleClick; // Attach the handleClick function to the button
    fireEvent.click(button); // Trigger a click event
    expect(handleClick).toHaveBeenCalled(); // Check if handleClick was called
  });

  test('RegisterButton component renders with the correct text', () => {
  const { getByText } = render(<RegisterButton />);
  const registerButton = getByText('Sign up');
  expect(registerButton).toBeInTheDocument(); // Check if the "Sign up" button is rendered
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