'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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

  return (
    <div>
      <Link href='/signup' passHref>
        <Button
          onClick={handleClick}
          className={` ${
            isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          } flex h-12 w-48 items-center justify-center rounded-full text-base font-semibold shadow-sm`}
          disabled={isLoading}
        >
          {isLoading ? 'Registering...' : 'Register'}
        </Button>
      </Link>
    </div>
  );
};

export default RegisterButton;
