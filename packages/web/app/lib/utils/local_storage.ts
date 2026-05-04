export const setItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.log('Error storing value: ', error);
  }
};

export const getItem = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.log('Error retrieving value: ', error);
  }
  return null;
};
