'use client'
import React, { useState } from 'react';
import { User } from '../models/user_class'; 

type LoginButtonProps = {
  username: string;
  password: string;
};

const user = User.getInstance();

const LoginButton: React.FC<LoginButtonProps> = ({ username, password }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (username === '' || password === '') {
      // Internal function to handle empty fields, likely showing an error message
      console.log("Username or password cannot be empty.");
      return;
    }

    setIsLoading(true);
    try {
      const status = await user.login(username, password);
      // Internal logic to update the component about login status
      console.log("Login status:", status);
      setIsLoading(false);
    } catch (error) {
      // Internal function to handle errors, likely showing an error message
      console.log("An error occurred during login:", error);
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handleLogin}
      className={`${
        isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } bg-blue-700 text-white w-48 h-12 rounded-full flex justify-center items-center font-semibold text-base shadow-sm disabled:opacity-50`}
      disabled={isLoading}
    >
      {isLoading ? 'Loading...' : 'Login'}
    </button>
  );
};

export default LoginButton;
