"use client";
import React from "react";

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
    title: "Engaging Communities",
    url: "http://www.engagingcommunities.org/introduction/",
  },
  {
    title: "Ethnographies of Work",
    url: "https://cuny.manifoldapp.org/projects/ethnographies-of-work",
  },
  {
    title: "Fieldnotes - Emerson",
    url: "https://williamwolff.org/wp-content/uploads/2016/01/emerson-fieldnotes-2011.pdf",
  },
  {
    title: "Fieldnote Vocabulary - UW",
    url: "https://faculty.washington.edu/stevehar/Fieldnote%20Vocabulary.pdf",
  },
];

const analogueResources = [
  "Agar, Michael. Speaking of Ethnography (SAGE Publications, 1986).",
  "Atkinson, Robert. The Life Story Interview (SAGE Publications, 1998).",
  "Bernard, H. Russell. Research Methods in Anthropology (Rowman & Littlefield, 2017).",
  "Certeau, Michel de. The Practice of Everyday Life (University of California Press, 1984).",
  "Geertz, Clifford. Local Knowledge: Further Essays In Interpretive Anthropology (Basic Books, 200).",
  "Kimmel, Allan. Ethics and Values in Applied Social Research (SAGE Publications, 1988).",
  "Maxwell, Joseph. Qualitative Research Design: An Interactive Approach (SAGE Publications, 2012).",
  "Pelto, Pertti J. Applied Ethnography: Guidelines for Field Research (Routledge, 2013).",
  "Scott, John. Social Network Analysis: A Handbook (SAGE Publications, 2011).",
  "Stewart, David and Prem Shamdasani. Focus Groups: Theory and Practice (SAGE Publications, 2014).",
  "Weller, Susan and A. Kimball. Romney. Systematic Data Collection (SAGE Publications, 1988).",
];

const ResourcesPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-10 text-center">Resources</h1>

      {/* Online Resources */}
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

      {/* Analogue Resources */}
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
