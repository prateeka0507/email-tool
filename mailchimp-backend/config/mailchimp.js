import mailchimpPkg from '@mailchimp/mailchimp_marketing';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// Set up Mailchimp with the correct server prefix
if (!process.env.MAILCHIMP_API_KEY || !process.env.MAILCHIMP_SERVER_PREFIX) {
  throw new Error('Missing required Mailchimp environment variables');
}

// Add validation for API key format
const apiKey = process.env.MAILCHIMP_API_KEY;
const serverPrefix = process.env.MAILCHIMP_SERVER_PREFIX;

// Ensure server prefix is in correct format (e.g., 'us13')
if (!/^[a-z]{2}\d+$/.test(serverPrefix)) {
  throw new Error('Invalid Mailchimp server prefix format');
}

mailchimpPkg.setConfig({
  apiKey: apiKey,
  server: serverPrefix
});

// Add logging to verify configuration
console.log('Mailchimp configured with server:', process.env.MAILCHIMP_SERVER_PREFIX);

// Test connection function
export const testConnection = async () => {
  try {
    await mailchimpPkg.ping.get();
    return true;
  } catch (error) {
    console.error('Mailchimp connection error:', {
      status: error.status,
      detail: error.response?.body?.detail || error.message
    });
    return false;
  }
};

export { mailchimpPkg as client };

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://soft-youtiao-73aeea.netlify.app';

const corsOptions = {
  origin: [FRONTEND_URL],
  // ... other options
};

export const config = {
  apiKey: process.env.MAILCHIMP_API_KEY,
  // ...
};
