// About.tsx
"use client";
import React, { useState, useRef } from "react";
import './AboutPage.css'; // Make sure the path matches where your CSS file is located

const AboutPage = () => {
  return (
    <div className="aboutPage">
      <section className="aboutHeader">
        <h1>About Us</h1>
      </section>
      <section className="aboutContent">
        <p>
          Welcome to [Your Project Name], a project dedicated to [Brief Description of the Project]. Our mission is to [Mission Statement or Goal].
        </p>
        <p>
          Founded in [Year] by [Founder's Name(s)], [Your Project Name] has grown to include a diverse team of [Describe Team Members, e.g., researchers, writers, artists, etc.]. Together, we [Briefly Describe What Your Team Does or Its Achievements].
        </p>
        <p>
          [Additional Paragraphs about the project, its history, objectives, or any other relevant information.]
        </p>
      </section>
      <section className="aboutTeam">
        <h2>Our Team</h2>
        <p>
          [Descriptions of team members, their roles, and contributions. You can include photos or links to their professional profiles if desired.]
        </p>
      </section>
      {/* Include more sections as needed */}
    </div>
  );
};

export default AboutPage;