import React, { useState } from 'react';
import { User } from '../models/user_class'; 

type LoginButtonProps = {
  username: string;
  password: string;
  onLoginStatus: (status: string) => void;
  onError: () => void;
};

const user = User.getInstance();

const LoginButton: React.FC<LoginButtonProps> = ({ username, password, onLoginStatus, onError }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (username === '' || password === '') {
      onError(); // Function to handle empty fields, likely showing an error message
      return;
    }

    setIsLoading(true);
    try {
      const status = await user.login(username, password);
      onLoginStatus(status); // Callback to update the parent component about login status
      setIsLoading(false);
    } catch (error) {
      onError(); // Function to handle errors, likely showing an error message
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
