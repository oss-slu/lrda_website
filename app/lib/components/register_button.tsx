'use client'
import React, { useState } from 'react';

type RegisterButtonProps = {
  // No props required for this visually matching button
};

const RegisterButton: React.FC<RegisterButtonProps> = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    // No functional logic is required for this visually matching button
  };

  const buttonStyle = {
    position: 'absolute',  // Position the button absolutely within the nearest positioned ancestor
    top: '0',             // Position it at the top
    right: '0',           // Position it at the right
    margin: '1rem',       // Add margin as needed
  };

  return (
    <div style={buttonStyle}>
      <button
        onClick={handleClick}
        className={`${
          isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } bg-blue-500 text-white w-48 h-12 rounded-full flex justify-center items-center font-semibold text-base shadow-sm disabled:opacity-50`}
        disabled={isLoading}
      >
        {isLoading ? 'Registering...' : 'Register'}
      </button>
    </div>
  );
};

export default RegisterButton;





