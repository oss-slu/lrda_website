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
