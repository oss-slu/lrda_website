"use client";
import React, { useState, useEffect } from "react";
import { User } from "../models/user_class";

type LoginButtonProps = {
  username: string;
  password: string;
};

const user = User.getInstance();

const LoginButton: React.FC<LoginButtonProps> = ({ username, password }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [snackState, toggleSnack] = useState(false);

  const onDismissSnackBar = () => toggleSnack(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (snackState) {
      timer = setTimeout(() => {
        toggleSnack(false); 
      }, 3000);
    }
    return () => {
      if (timer !== null) {
        clearTimeout(timer as ReturnType<typeof setTimeout>);
      }
    };
  }, [snackState]);
  
  
  const handleLogin = async () => {
    if (username === "" || password === "") {
      // Internal function to handle empty fields, likely showing an error message
      console.log("Username or password cannot be empty.");
      return;
    }

    setIsLoading(true);
    try {
      const status = await user.login(username, password);
      // Internal logic to update the component about login status
      console.log("Login status:", status);
      if(status == "success"){

        localStorage.setItem(username, password);
        window.location.href = '/';
      }
      setIsLoading(false);
    } catch (error) {
      // Internal function to handle errors, likely showing an error message
      console.log("An error occurred during login:", error);
      toggleSnack(true);
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleLogin}
        className={`${
          isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        } bg-blue-700 text-white w-48 h-12 rounded-full flex justify-center items-center font-semibold text-base shadow-sm disabled:opacity-50`}
        disabled={isLoading}
      >
        {isLoading ? "Loading..." : "Login"}
      </button>
      <div className="flex flex-col items-center justify-center w-full h-full">
        {snackState && (
          <div className="fixed bottom-20 bg-white text-center p-5 rounded-lg">
            Invalid User Credentials
            <button className="ml-8 text-blue-500" onClick={onDismissSnackBar}>
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginButton;
