import mailchimpPkg from '@mailchimp/mailchimp_marketing';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// Set up Mailchimp with the correct server prefix
if (!process.env.MAILCHIMP_API_KEY || !process.env.MAILCHIMP_SERVER_PREFIX) {
  throw new Error('Missing required Mailchimp environment variables');
}

mailchimpPkg.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER_PREFIX
});

// Add logging to verify configuration
console.log('Mailchimp configured with server:', process.env.MAILCHIMP_SERVER_PREFIX);

// Test connection function
const testConnection = async () => {
  try {
    const response = await mailchimpPkg.ping.get();
    console.log('Mailchimp connection successful:', response);
    return true;
  } catch (error) {
    console.error('Mailchimp connection failed:', error);
    return false;
  }
};

export { mailchimpPkg as client, testConnection };