'use client'
import React, { useState } from 'react';

type RegisterButtonProps = {
  // No props required for this visually matching button
};

const RegisterButton: React.FC<RegisterButtonProps> = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setIsLoading(true); // Set loading state when clicked
    // Simulate an API call or any asynchronous operation
    setTimeout(() => {
      setIsLoading(false); // Set loading state to false after the operation is complete
    }, 2000); // Simulate a 2-second loading period

    // No functional logic is required for this visually matching button
  };

  const buttonStyle = {
    margin: '0', // Remove any margin
  };

  // Add margin-top to create space between the LoginButton and RegisterButton
  const buttonContainerStyle = {
    marginTop: '1rem', // Adjust the margin-top as needed
  };

  return (
    <div style={buttonContainerStyle}>
      <button
        onClick={handleClick}
        className={`${
          isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } bg-blue-700 text-white w-48 h-12 rounded-full flex justify-center items-center font-semibold text-base shadow-sm`}
        disabled={isLoading} // Disable the button when in a loading state
      >
        {isLoading ? 'Registering...' : 'Register'}
      </button>
    </div>
  );
};

export default RegisterButton;





