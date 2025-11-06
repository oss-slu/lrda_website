"use client";
import React from "react";

const onlineResources = [
  {
    title: "American Anthropolicial Association Resources on Ethics",
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
export const formatCitation = (citation: string): React.ReactNode => {
  // Find the comma (separates last name from first name in author)
  const commaIndex = citation.indexOf(',');
  
  // Case 1: No comma - italicize the entire citation
  if (commaIndex === -1) {
    return <span className="italic" style={{ fontStyle: 'italic' }}>{citation}</span>;
  }
  
  // Case 2 & 3: Has comma - find where the title starts
  // The title starts after a period (or comma) that is followed by a space and a capital letter
  
  // First, try to find "et. al." (Case 3)
  const etAlIndex = citation.toLowerCase().indexOf('et. al.');
  if (etAlIndex !== -1) {
    // "et. al." ends with a period, so find the space after it
    const spaceAfterEtAl = citation.indexOf(' ', etAlIndex + 7);
    if (spaceAfterEtAl !== -1 && spaceAfterEtAl + 1 < citation.length && /[A-Z]/.test(citation[spaceAfterEtAl + 1])) {
      const title = citation.substring(spaceAfterEtAl + 1).trim();
      const author = citation.substring(0, spaceAfterEtAl);
      return (
        <>
          {author} <span className="italic" style={{ fontStyle: 'italic' }}>{title}</span>
        </>
      );
    }
  }
  
  // Otherwise, find the last period before the end that is followed by space and capital letter (Case 2)
  const lastPeriodIndex = citation.lastIndexOf('.');
  let authorEndIndex = -1;
  
  // Search backwards from the end to find the period that starts the title
  // Start from lastPeriodIndex (not lastPeriodIndex - 1) to check the period itself
  const searchStart = lastPeriodIndex !== -1 ? lastPeriodIndex : citation.length - 1;
  for (let i = searchStart; i > commaIndex; i--) {
    if (citation[i] === '.' && i + 1 < citation.length && citation[i + 1] === ' ' && /[A-Z]/.test(citation[i + 2])) {
      authorEndIndex = i;
      break;
    }
  }
  
  // If no period found, try to find a comma followed by space and capital letter
  if (authorEndIndex === -1) {
    for (let i = citation.length - 1; i > commaIndex; i--) {
      if (citation[i] === ',' && i + 1 < citation.length && citation[i + 1] === ' ' && /[A-Z]/.test(citation[i + 2])) {
        const remainingText = citation.substring(i + 2);
        if (remainingText.length > 10) {
          authorEndIndex = i;
          break;
        }
      }
    }
  }
  
  if (authorEndIndex === -1) {
    // Couldn't find the pattern, return as-is
    return citation;
  }
  
  // Split into author and title
  // Title starts after the period and space (authorEndIndex + 2) and goes to the end
  const author = citation.substring(0, authorEndIndex + 1);
  let title = citation.substring(authorEndIndex + 2).trim();
  
  // Remove ending period if present (it's part of the citation format, not the title)
  if (title.endsWith('.')) {
    title = title.slice(0, -1);
  }
  
  return (
    <>
      {author} <span className="italic" style={{ fontStyle: 'italic' }}>{title}</span>
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
                className="text-blue-600 hover:underline [&_span]:text-blue-600 [&_span]:italic"
              >
                {formatCitation(resource.title)}
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
