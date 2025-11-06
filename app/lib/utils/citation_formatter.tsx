import React from "react";

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

