"use client";
import React, { useState, useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";

type LoginButtonProps = {
  username: string;
  password: string;
};

const LoginButton: React.FC<LoginButtonProps> = ({ username, password }) => {
  const { login } = useAuthStore(
    useShallow((state) => ({
      login: state.login,
    }))
  );

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
      const status = await login(username, password);
      // Internal logic to update the component about login status
      console.log("Login status:", status);
      if (status == "success") {
        // Do not store passwords in localStorage - security risk
        // Authentication is handled by Firebase Auth tokens
        window.location.href = "/map";
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
      <Button
        onClick={handleLogin}
        className={`${
          isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        } w-48 h-12 rounded-full flex justify-center items-center font-semibold text-base shadow-sm disabled:opacity-50`}
        disabled={isLoading}
      >
        {isLoading ? "Loading..." : "Login"}
      </Button>
      <div className="flex flex-col items-center justify-center w-full h-full">
        {snackState && (
          <div className="fixed bottom-10 inset-x-0 flex justify-center items-center">
            <div className="bg-white w-80 rounded-lg text-center p-2">
              <p className="mb-2">Invalid User Credentials</p>
              <button className="text-sm text-blue-500 hover:underline" onClick={onDismissSnackBar}>
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginButton;
