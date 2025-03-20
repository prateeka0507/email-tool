// services/audience.js
import mailchimp from '@mailchimp/mailchimp_marketing';
import csvParser from 'csv-parser';
import fs from 'fs';

// Make sure mailchimp is configured before using it
mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER_PREFIX
});

// Get all lists/audiences
export const getAllLists = async () => {
  try {
    const response = await mailchimp.lists.getAllLists();
    return response.lists;
  } catch (error) {
    console.error('Error fetching lists:', error);
    throw error;
  }
};

// Add a subscriber to a list
const addSubscriber = async (listId, email, fields = {}) => {
  try {
    const response = await mailchimp.lists.addListMember(listId, {
      email_address: email,
      status: 'subscribed',
      merge_fields: fields
    });
    return response;
  } catch (error) {
    throw new Error(`Failed to add subscriber: ${error.message}`);
  }
};

// Bulk import subscribers from CSV
const bulkImport = async (listId, file) => {
  try {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Process the CSV file and add subscribers
    const subscribers = await new Promise((resolve, reject) => {
      const subscribers = [];
      fs.createReadStream(file.path)
        .pipe(csvParser())
        .on('data', (data) => subscribers.push(data))
        .on('end', () => resolve(subscribers))
        .on('error', (error) => reject(error));
    });

    for (const subscriber of subscribers) {
      if (!subscriber.email) {
        results.failed++;
        results.errors.push('Missing email address');
        continue;
      }

      try {
        await addSubscriber(listId, subscriber.email, {
          FNAME: subscriber.first_name || '',
          LNAME: subscriber.last_name || ''
        });
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Error adding ${subscriber.email}: ${error.message}`);
      }
    }

    return results;
  } catch (error) {
    throw new Error(`Failed to bulk import: ${error.message}`);
  }
};

// Create a new segment
const createSegment = async (listId, name, conditions) => {
  try {
    const response = await mailchimp.lists.createSegment(listId, {
      name,
      options: {
        match: 'all',
        conditions: conditions || []
      }
    });
    return response;
  } catch (error) {
    throw new Error(`Failed to create segment: ${error.message}`);
  }
};

// Add members to a segment
const addMembersToSegment = async (listId, segmentId, emails) => {
  try {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const email of emails) {
      try {
        await mailchimp.lists.addSegmentMember(listId, segmentId, {
          email_address: email
        });
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Error adding ${email}: ${error.message}`);
      }
    }

    return results;
  } catch (error) {
    throw new Error(`Failed to add members to segment: ${error.message}`);
  }
};

export default {
  getAllLists,
  addSubscriber,
  bulkImport,
  createSegment,
  addMembersToSegment
};
