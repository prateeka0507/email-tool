import express from 'express';
import multer from 'multer';
import fs from 'fs';
import csvParser from 'csv-parser';
import audienceService from '../services/audience.js';
import { client as mailchimp } from '../config/mailchimp.js';
import upload from '../middleware/upload.js';
import Subscriber from '../models/Subscriber.js';

const router = express.Router();

// Configure multer for file uploads
const uploadMulter = multer({ dest: 'uploads/' });

// Ensure uploads directory exists
const dir = './uploads';
if (!fs.existsSync(dir)){
  fs.mkdirSync(dir);
}

// GET all lists/audiences
router.get('/lists', async (req, res) => {
  try {
    const response = await mailchimp.lists.getAllLists();
    res.json(response.lists);
  } catch (error) {
    console.error('Error fetching lists:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Mailchimp lists',
      details: error.message 
    });
  }
});

// POST add a subscriber to a list
router.post('/lists/:listId/members', async (req, res) => {
  try {
    const { listId } = req.params;
    const { email, fields } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const subscriber = await audienceService.addSubscriber(listId, email, fields);
    res.status(201).json(subscriber);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST bulk import subscribers from CSV
router.post('/lists/:listId/bulk-import', upload.single('file'), (req, res) => {
  try {
    const { listId } = req.params;
    console.log('Importing to list ID:', listId);
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const subscribers = [];
    fs.createReadStream(req.file.path)
      .pipe(csvParser())
      .on('data', (data) => subscribers.push(data))
      .on('end', async () => {
        console.log('Parsed subscribers:', subscribers);
        
        // Clean up the file
        fs.unlinkSync(req.file.path);
        
        const results = {
          success: 0,
          failed: 0,
          errors: []
        };
        
        for (const subscriber of subscribers) {
          if (!subscriber.email) {
            results.failed++;
            results.errors.push('Missing email address');
            continue;
          }
          
          try {
            // Add to Mailchimp
            await mailchimp.lists.addListMember(listId, {
              email_address: subscriber.email,
              status: 'subscribed',
              merge_fields: {
                FNAME: subscriber.first_name || '',
                LNAME: subscriber.last_name || ''
              }
            });

            // Save to MongoDB
            await Subscriber.findOneAndUpdate(
              { email: subscriber.email, listId },
              {
                firstName: subscriber.first_name || '',
                lastName: subscriber.last_name || '',
                status: 'subscribed',
                subscriptionDate: new Date()
              },
              { upsert: true, new: true }
            );

            results.success++;
          } catch (error) {
            results.failed++;
            results.errors.push(`Error adding ${subscriber.email}: ${error.message}`);
          }
        }
        
        res.json({
          message: 'Import completed',
          results
        });
      });
  } catch (error) {
    console.error('Error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

// POST create a new segment
router.post('/lists/:listId/segments', async (req, res) => {
  try {
    const { listId } = req.params;
    const { name, conditions } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Segment name is required' });
    }
    
    const segment = await audienceService.createSegment(listId, name, conditions);
    res.status(201).json(segment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST add members to a segment
router.post('/lists/:listId/segments/:segmentId/members', async (req, res) => {
  try {
    const { listId, segmentId } = req.params;
    const { emails } = req.body;
    
    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'Array of emails is required' });
    }
    
    const result = await audienceService.addMembersToSegment(listId, segmentId, emails);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST upload a file
router.post('/upload', uploadMulter.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csvParser())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      // Clean up the uploaded file
      fs.unlinkSync(req.file.path);
      res.json({ message: 'File processed successfully', data: results });
    })
    .on('error', (error) => {
      res.status(500).json({ error: 'Error processing file' });
    });
});

// Add other audience-related routes here
router.get('/', async (req, res) => {
  try {
    // Handle getting audience list
    res.json({ message: 'Audience list endpoint' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router; 