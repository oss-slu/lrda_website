export const extractNoteId = (fullUri: string): string => {
  if (fullUri.startsWith('http')) {
    // Splits by '/' and returns the last segment
    const parts = fullUri.split('/');
    return parts[parts.length - 1];
  }
  // If it's not a URI, assume it's already the clean ID
  return fullUri;
};