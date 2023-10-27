// pages/index.js
'use client'
import React from 'react';
import RegisterButton from '..lib/components/register_button';

const HomePage = () => {
  return (
    <div>
      <h1>Welcome to My Next.js App</h1>
      <RegisterButton />
    </div>
  );
};

export default HomePage;
