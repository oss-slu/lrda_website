

export const setItem = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.log('Error storing value: ', error);
    }
  };
  
  export const getItem = (key: string) => {
    try {
      const value = localStorage.getItem(key);
      return value;
    } catch (error) {
      console.log('Error retrieving value: ', error);
    }
  };
  
  export const removeItem = (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.log('Error deleting value: ', error);
    }
  };
  