"use client";
import React, { useState, useEffect } from "react";
import { User } from "./lib/models/user_class";
import WelcomePage from "./WelcomePage";
import Home from "./Home";
import AboutPage from "./lib/pages/aboutPage/AboutPage";

const IndexPage: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const user = User.getInstance();
      const id = await user.getId();
      setUserId(id);
    };

    fetchUser();
  }, []);

  if (!userId) {
    return <WelcomePage />;
  }

  return <Home />;
};

export default IndexPage;
