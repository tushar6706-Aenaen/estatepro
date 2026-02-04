/**
 * Input validation and sanitization utilities
 */

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): {
  valid: boolean;
  message?: string;
} => {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters" };
  }
  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }
  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one lowercase letter",
    };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" };
  }
  return { valid: true };
};

export const validatePhone = (phone: string): boolean => {
  // Allow various phone formats: +1234567890, 123-456-7890, (123) 456-7890, etc.
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  const cleaned = phone.replace(/\D/g, "");
  return phoneRegex.test(phone) && cleaned.length >= 10 && cleaned.length <= 15;
};

export const sanitizeString = (input: string): string => {
  // Remove any potentially harmful characters
  return input.trim().replace(/[<>]/g, "");
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validatePrice = (price: number | string): boolean => {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  return !isNaN(numPrice) && numPrice >= 0 && numPrice <= 999999999;
};

export const validateBedsBaths = (value: number | string): boolean => {
  const num = typeof value === "string" ? parseInt(value, 10) : value;
  return !isNaN(num) && num >= 0 && num <= 50;
};

export const validateArea = (area: number | string): boolean => {
  const numArea = typeof area === "string" ? parseFloat(area) : area;
  return !isNaN(numArea) && numArea > 0 && numArea <= 1000000;
};
