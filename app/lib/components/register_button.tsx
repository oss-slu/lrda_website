// components/RegisterButton.js

import React from 'react';

const RegisterButton = () => {
  return (
    <button className="register-button">
      Register
      <style jsx>{`
        .register-button {
          background-color: #0070f3;
          color: #fff;
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        .register-button:hover {
          background-color: #0056b3;
        }
      `}</style>
    </button>
  );
};

export default RegisterButton;
