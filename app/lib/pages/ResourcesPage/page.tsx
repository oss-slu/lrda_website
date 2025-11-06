"use client";
import React from "react";

const onlineResources = [
  {
    title: "American Anthropolicial Association Ressources on Ethics",
    url: "https://americananthro.org/about/anthropological-ethics/",
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

// Helper function to format citation with italicized book title
const formatCitation = (citation: string): React.ReactNode => {
  // Find the last period (end of citation)
  const lastPeriodIndex = citation.lastIndexOf('.');
  
  if (lastPeriodIndex === -1) {
    return citation;
  }
  
  // Find the comma (separates last name from first name in author)
  const commaIndex = citation.indexOf(',');
  
  if (commaIndex === -1) {
    // No comma found, return as-is
    return citation;
  }
  
  // Find the period that marks the end of the author name
  // The title starts after a period that is followed by a space and a capital letter
  // We search from the end backwards to find the last such period before the final period
  let authorEndIndex = -1;
  
  for (let i = lastPeriodIndex - 1; i > commaIndex; i--) {
    if (citation[i] === '.' && i + 1 < citation.length && citation[i + 1] === ' ') {
      // Check if the next character after the space is a capital letter (start of title)
      if (i + 2 < citation.length && /[A-Z]/.test(citation[i + 2])) {
        authorEndIndex = i;
        break;
      }
    }
  }
  
  if (authorEndIndex === -1) {
    // Couldn't find the pattern, return as-is
    return citation;
  }
  
  // Split into author and title
  const author = citation.substring(0, authorEndIndex + 1);
  const title = citation.substring(authorEndIndex + 2, lastPeriodIndex).trim();
  
  return (
    <>
      {author} <span className="italic">{title}</span>.
    </>
  );
};

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
