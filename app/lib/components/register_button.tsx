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

  return (
    <div className="fixed top-0 right-0 m-4">
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




