"use client";
import React from "react";
import { formatCitation } from "../lib/utils/citation_formatter";

type OnlineResource = {
  title: string;
  url: string;
  plain?: boolean;
};

const onlineResources: OnlineResource[] = [
  {
    title: "American Anthropological Association Resources on Ethics",
    url: "https://americananthro.org/about/anthropological-ethics/",
    plain: true,
  },
  {
    title: "Malley, Suzanne Blum and Ames Hawkins. Engaging Communities: Writing Ethnographic Research",
    url: "http://www.engagingcommunities.org/introduction/",
  },
  {
    title: "Tyner- Millings, Alia R. et. al. Ethnography Made Easy",
    url: "https://cuny.manifoldapp.org/projects/ethnographies-of-work",
  },
  {
    title: "Emerson, Robert, Rachel Fretz, and Linda Shaw, Writing Ethnographic Fieldnotes",
    url: "https://williamwolff.org/wp-content/uploads/2016/01/emerson-fieldnotes-2011.pdf",
  },
];

const FurtherReading = [
  "Agar, Michael. Speaking of Ethnography.",
  "Atkinson, Robert. The Life Story Interview.",
  "Bernard, H. Russell. Research Methods in Anthropology.",
  "Certeau, Michel de. The Practice of Everyday Life.",
  "Geertz, Clifford. Local Knowledge: Further Essays In Interpretive Anthropology.",
  "Kimmel, Allan. Ethics and Values in Applied Social Research.",
  "Maxwell, Joseph. Qualitative Research Design: An Interactive Approach.",
  "Pelto, Pertti J. Applied Ethnography: Guidelines for Field Research.",
  "Scott, John. Social Network Analysis: A Handbook.",
  "Stewart, David and Prem Shamdasani. Focus Groups: Theory and Practice.",
  "Weller, Susan and A. Kimball. Romney. Systematic Data Collection.",
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
                className="text-blue-600 hover:underline [&_span]:text-blue-600 [&_span]:italic"
              >
                {resource.plain ? resource.title : formatCitation(resource.title)}
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* Analogue Resources */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Further Reading</h2>
        <ul className="space-y-4">
          {FurtherReading.map((citation, index) => (
            <li key={index} className="bg-white shadow-md p-4 rounded-md text-gray-800">
              {formatCitation(citation)}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default ResourcesPage;
