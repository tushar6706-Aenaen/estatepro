/**
 * Environment variable validation and error handling
 */

export const getRequiredEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. Please check your .env.local file.`,
    );
  }
  return value;
};

export const validateSupabaseConfig = (): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL is missing");
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing");
  }

  // Check format
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith("https://")
  ) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL must be a valid HTTPS URL");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const isProduction = (): boolean => {
  return process.env.NODE_ENV === "production";
};

export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === "development";
};
