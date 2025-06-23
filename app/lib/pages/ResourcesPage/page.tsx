"use client";

import { title } from "node:process";
import React from "react";

const ResourcesPage: React.FC = () => {
  const onlineResources = [
    {
      title: "AAA Statement on Ethics",
      url: "https://americananthro.org/about/policies/statement-on-ethics/",
    },
    {
      title: "AAA Handbook on Ethical Issues",
      url: "https://americananthro.org/learn-teach/handbook-on-ethical-issues-in-anthropology/",
    },
    {
      title: "Malley, Suzanne Blum and Ames Hawkins. Engaging Communities: Writing Ethnographic Research",
      url: "http://www.engagingcommunities.org/introduction/",
    },
    {
      title: "Tyner-Mullings, Alia R., Mary Gatta, Thomas Martin, and Ryan Coughlan, ed. Ethnography Made Easy",
      url: "https://cuny.manifoldapp.org/projects/ethnographies-of-work",
    },
    {
      title: "Emerson, Robert M., Rachel I. Fritz, and Linda L. Shaw. Writing Ethnographic Fieldnotes (University of Chicago Press, 2011).",
      url: "https://williamwolff.org/wp-content/uploads/2016/01/emerson-fieldnotes-2011.pdf",
    },
    {
      title: `Sanjek, Roger, ed. "A Vocabulary for Field Notes," Fieldnotes: The Makings of Anthropology (Cornell University Press, 1990).`,
      url: "https://faculty.washington.edu/stevehar/Fieldnote%20Vocabulary.pdf",
    },
    {
      title: "Geertz, Clifford. Local Knowledge: Further Essays In Interpretive Anthropology (Basic Books, 1983).",
      url: "https://monoskop.org/images/d/d9/Geertz_Clifford_Local_Knowledge_Further_Essays_in_Interpretive_Anthropology_1983.pdf",
    },
    {
      title: `Geertz, Clifford. "Thick Description: Toward an Interpretive Theory of Culture," The Interpretation of Cultures (Basic Books, 1973).`,
      url: "http://wendynorris.com/wp-content/uploads/2018/12/Geertz-1973-Thick-Description_-Toward-an-interpretive-theory-of-cultures.pdf",
    }
  ];

  const analogueResources = [
    "Agar, Michael. Speaking of Ethnography (SAGE Publications, 1986).",
    "Atkinson, Robert. The Life Story Interview (SAGE Publications, 1998).",
    "Bernard, H. Russell. Research Methods in Anthropology (Rowman & Littlefield, 2017).",
    "Certeau, Michel de. The Practice of Everyday Life (University of California Press, 1984).",
    "Geertz, Clifford. Local Knowledge: Further Essays In Interpretive Anthropology (Basic Books, 1983).",
    "Kimmel, Allan. Ethics and Values in Applied Social Research (SAGE Publications, 1988).",
    "Maxwell, Joseph. Qualitative Research Design: An Interactive Approach (SAGE Publications, 2012).",
    "Pelto, Pertti J. Applied Ethnography: Guidelines for Field Research (Routledge, 2013).",
    "Scott, John. Social Network Analysis: A Handbook (SAGE Publications, 2011).",
    "Stewart, David and Prem Shamdasani. Focus Groups: Theory and Practice (SAGE Publications, 2014).",
    "Weller, Susan and A. Kimball Romney. Systematic Data Collection (SAGE Publications, 1988).",
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-10 text-center">Resources</h1>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Online Resources</h2>
        <ul className="space-y-4">
          {onlineResources.map((resource) => (
            <li key={resource.url} className="bg-white shadow-md p-4 rounded-md">
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {resource.title}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6">Analogue Resources</h2>
        <ul className="space-y-4">
          {analogueResources.map((citation, index) => (
            <li key={index} className="bg-white shadow-md p-4 rounded-md text-gray-800">
              {citation}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default ResourcesPage;
