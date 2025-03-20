import express from 'express';
import Campaign from '../models/Campaign.js';
import { createCampaign, setCampaignContent, sendCampaign, createAndSendCampaign } from '../services/campaign.js';
import { client as mailchimp } from '../config/mailchimp.js';
import Subscriber from '../models/Subscriber.js';

const router = express.Router();

// POST create a new campaign
router.post('/', async (req, res) => {
  try {
    const campaign = new Campaign(req.body);
    await campaign.save();
    res.status(201).json(campaign);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT set content for a campaign
router.put('/:campaignId/content', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { html } = req.body;
    
    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }
    
    const result = await setCampaignContent(campaignId, html);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST send a campaign
router.post('/:campaignId/send', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const result = await sendCampaign(campaignId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST bulk email (create and send in one operation)
router.post('/bulk-send', async (req, res) => {
  try {
    const { 
      listId, 
      subject, 
      fromName, 
      replyTo, 
      htmlContent 
    } = req.body;
    
    // Validate required fields
    if (!listId || !subject || !fromName || !replyTo || !htmlContent) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields' 
      });
    }
    
    // Step 1: Create a campaign
    const campaign = await mailchimp.campaigns.create({
      type: 'regular',
      recipients: {
        list_id: listId
      },
      settings: {
        subject_line: subject,
        from_name: fromName,
        reply_to: replyTo,
        title: `Campaign ${new Date().toISOString()}`
      }
    });
    
    // Step 2: Set the content
    await mailchimp.campaigns.setContent(campaign.id, {
      html: htmlContent
    });
    
    // Step 3: Send the campaign
    await mailchimp.campaigns.send(campaign.id);
    
    // Save to MongoDB
    const campaignDoc = new Campaign({
      subject,
      content: htmlContent,
      listId,
      sentDate: new Date()
    });

    // Get subscribers for this list from MongoDB
    const subscribers = await Subscriber.find({ listId });
    campaignDoc.subscribers = subscribers.map(sub => sub._id);
    
    await campaignDoc.save();
    
    res.json({
      success: true,
      message: 'Email campaign sent successfully',
      campaignId: campaign.id,
      subscriberCount: subscribers.length
    });
  } catch (error) {
    console.error('Error sending campaign:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// GET all campaigns
router.get('/', async (req, res) => {
  try {
    const campaigns = await Campaign.find();
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router; 