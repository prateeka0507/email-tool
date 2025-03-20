import mailchimp from '@mailchimp/mailchimp_marketing';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

const configureMailchimp = () => {
  if (!process.env.MAILCHIMP_API_KEY || !process.env.MAILCHIMP_SERVER_PREFIX) {
    throw new Error('Missing required Mailchimp configuration');
  }

  mailchimp.setConfig({
    apiKey: process.env.MAILCHIMP_API_KEY,
    server: process.env.MAILCHIMP_SERVER_PREFIX // e.g., 'us13'
  });

  // Test the connection
  return mailchimp.ping.get()
    .then(() => console.log('Mailchimp connection successful'))
    .catch(error => {
      console.error('Mailchimp connection error:', error);
      throw error;
    });
};

export default configureMailchimp;

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://soft-youtiao-73aeea.netlify.app';

const corsOptions = {
  origin: [FRONTEND_URL],
  // ... other options
};

export const config = {
  apiKey: process.env.MAILCHIMP_API_KEY,
  // ...
};
