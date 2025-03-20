import mailchimp from '@mailchimp/mailchimp_marketing';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// Configure the mailchimp client
mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER_PREFIX // e.g., 'us13'
});

// Export the configured client
export const client = mailchimp;

// You can also export the configuration function if needed
export const testConnection = async () => {
  try {
    await mailchimp.ping.get();
    console.log('Mailchimp connection successful');
    return true;
  } catch (error) {
    console.error('Mailchimp connection error:', error);
    throw error;
  }
};

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://soft-youtiao-73aeea.netlify.app';

const corsOptions = {
  origin: [FRONTEND_URL],
  // ... other options
};

export const config = {
  apiKey: process.env.MAILCHIMP_API_KEY,
  // ...
};
