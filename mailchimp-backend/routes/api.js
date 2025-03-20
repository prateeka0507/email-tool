// src/services/api.js
import axios from 'axios';
import express from 'express';
const router = express.Router();
const cors = require('cors');

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Configure CORS with specific options
const corsOptions = {
  origin: ['https://soft-youtiao-73aeea.netlify.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Apply CORS middleware
router.use(cors(corsOptions));

export const audienceService = {
  getAllLists: () => api.get('/audience/lists'),
  bulkImport: (listId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/audience/lists/${listId}/bulk-import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

export const campaignService = {
  bulkSend: (data) => api.post('/campaigns/bulk-send', data)
};

export default router;
