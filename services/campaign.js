import { client as mailchimp } from '../config/mailchimp.js';

// Create a new campaign
const createCampaign = async (campaignData) => {
  try {
    const response = await mailchimp.campaigns.create({
      type: 'regular',
      recipients: {
        list_id: campaignData.listId
      },
      settings: {
        subject_line: campaignData.subject,
        from_name: campaignData.fromName,
        reply_to: campaignData.replyTo,
        title: campaignData.title || 'Campaign ' + new Date().toISOString()
      }
    });
    return response;
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
};

// Set the content for a campaign
const setCampaignContent = async (campaignId, html) => {
  try {
    const response = await mailchimp.campaigns.setContent(campaignId, {
      html
    });
    return response;
  } catch (error) {
    console.error('Error setting campaign content:', error);
    throw error;
  }
};

// Send a campaign
const sendCampaign = async (campaignId) => {
  try {
    const response = await mailchimp.campaigns.send(campaignId);
    return response;
  } catch (error) {
    console.error('Error sending campaign:', error);
    throw error;
  }
};

// Create and send campaign in one operation
const createAndSendCampaign = async (campaignData, htmlContent) => {
  try {
    console.log('Creating campaign with data:', campaignData);
    
    // Step 1: Create the campaign
    const campaign = await createCampaign(campaignData);
    console.log('Campaign created:', campaign.id);
    
    // Step 2: Set the content
    await setCampaignContent(campaign.id, htmlContent);
    console.log('Campaign content set');
    
    // Step 3: Send the campaign
    await sendCampaign(campaign.id);
    console.log('Campaign sent');
    
    return {
      success: true,
      campaignId: campaign.id,
      message: 'Campaign created and sent successfully'
    };
  } catch (error) {
    console.error('Error in bulk email operation:', error);
    throw {
      success: false,
      error: error.message,
      details: error.response?.body || error.stack
    };
  }
};

// Get all campaigns
const getAllCampaigns = async () => {
  try {
    const response = await mailchimp.campaigns.list();
    return response.campaigns;
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }
};

export {
  createCampaign,
  setCampaignContent,
  sendCampaign,
  createAndSendCampaign,
  getAllCampaigns
};
