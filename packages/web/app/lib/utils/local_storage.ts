export const setItem = (key: string, value: string) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.log('Error storing value: ', error);
    }
  }
};

export const getItem = (key: string) => {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.log('Error retrieving value: ', error);
    }
  }
  return null;
};
