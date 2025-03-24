import { toast } from 'sonner';

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    toast.error("Invalid email address");
    return false;
  }
  return true;
};

export const validatePassword = (password) => {
  if (password.length < 6) {
    toast.error("Password must be at least 6 characters long");
    return false;
  }
  // Add more password validations as needed
  return true;
};


//Only checks if there is at least one character in each field. Can be changed in the future.
export const validateFirstName = (firstName) => {
  if (firstName.length == 0) {
    toast.error("Must provide a first name");
    return false;
  }
  return true;
};

export const validateLastName = (lastName) => {
  if (lastName.length == 0) {
    toast.error("Must provide a last name");
    return false;
  }
  return true;
};
