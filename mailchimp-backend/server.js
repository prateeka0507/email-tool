// Change all require statements to import statements
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mailchimpPkg from '@mailchimp/mailchimp_marketing';
import mongoose from 'mongoose';
import csvParser from 'csv-parser';
import { client as mailchimp, testConnection } from './config/mailchimp.js';
import audienceRouter from './routes/audience.js';
import campaignRouter from './routes/campaign.js';

// Get current filename and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Import your MongoDB connection
import connectDB from './config/db.js';

// Import routes (make sure to add .js extension)
import apiRoutes from './routes/api.js';

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Use routes
app.use('/api', apiRoutes);
app.use('/api/audience', audienceRouter);
app.use('/api/campaigns', campaignRouter);

// Test the connection when server starts
testConnection()
  .then(isConnected => {
    if (isConnected) {
      console.log('✅ Mailchimp connection verified on server start');
    } else {
      console.error('❌ Failed to connect to Mailchimp on server start');
    }
  })
  .catch(error => {
    console.error('❌ Error testing Mailchimp connection:', error);
  });

// Test route for Mailchimp connection
app.get('/api/test-mailchimp', async (req, res) => {
  try {
    const response = await mailchimp.ping.get();
    res.json({ status: 'success', message: 'Connected to Mailchimp API' });
  } catch (error) {
    console.error('Mailchimp connection error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Simple test endpoint
app.get('/api/test-mailchimp-lists', async (req, res) => {
  try {
    const response = await mailchimp.lists.getAllLists();
    console.log('Successfully fetched lists:', response.lists.length, 'lists found');
    res.json(response.lists);
  } catch (error) {
    console.error('Mailchimp API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Mailchimp lists',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Make sure uploads directory exists
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// Bulk email routes
app.post('/api/audience/lists/:listId/bulk-import', upload.single('file'), (req, res) => {
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
        
        // Add subscribers to Mailchimp
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
            await mailchimp.lists.addListMember(listId, {
              email_address: subscriber.email,
              status: 'subscribed',
              merge_fields: {
                FNAME: subscriber.first_name || '',
                LNAME: subscriber.last_name || ''
              }
            });
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

// Define a simple route
app.get('/', (req, res) => {
  res.send('Hello from Express Server!');
});

// Error Handling Middleware
app.use((req, res, next) => {
  res.status(404).send('Not Found');
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'MulterError') {
    return res.status(400).json({ 
      error: 'File upload error',
      details: err.message 
    });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});