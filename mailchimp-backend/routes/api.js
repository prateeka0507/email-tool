// src/services/api.js
import axios from 'axios';
import express from 'express';
import cors from 'cors';
import { Router } from 'express';
import { getAllLists } from '../services/audience.js';

const router = Router();

const API_URL = 'https://email-tool-chry.onrender.com';

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

// Get all audience lists
router.get('/audience/lists', async (req, res) => {
  try {
    const lists = await getAllLists();
    res.json(lists);
  } catch (error) {
    console.error('Error in /audience/lists route:', error);
    res.status(500).json({
      error: 'Failed to fetch lists',
      message: error.message
    });
  }
});

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
