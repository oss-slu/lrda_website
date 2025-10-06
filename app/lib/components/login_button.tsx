"use client";
import React, { useState, useEffect } from "react";
import { User } from "../models/user_class";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

type LoginButtonProps = {
  username: string;
  password: string;
};


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
    if (username.trim() === "" || password.trim() === "") {
      // show accessible error
      toast.error("Please enter email/username and password");
      return;
    }
    // Resolve the singleton at click time so tests can mock User.getInstance()
    // before the component is imported. Avoid calling it at module scope.
    const user = User.getInstance();

    setIsLoading(true);
    try {
      const status = await user.login(username, password);
      // Internal logic to update the component about login status
      console.log("Login status:", status);
      if (status == "success") {
        // redirect on success
        window.location.href = "/lib/pages/map";
      }
      setIsLoading(false);
    } catch (error) {
      // Internal function to handle errors, likely showing an error message
      console.log("An error occurred during login:", error);
      toast.error("Login failed. Please check your credentials.");
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div role="group" aria-busy={isLoading} aria-live="polite">
        <Button
          onClick={handleLogin}
          className={`${
            isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          } w-48 h-12 rounded-full flex justify-center items-center font-semibold text-base shadow-sm disabled:opacity-50`}
          disabled={isLoading}
          aria-disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Login"}
        </Button>
      </div>
      <div aria-live="assertive" className="sr-only">
        {/* errors are shown via toast; keep SR-only region for future inline messages */}
      </div>
    </div>
  );
};

export default LoginButton;
