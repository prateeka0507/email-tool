import mongoose from 'mongoose';

const CampaignSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  sentDate: {
    type: Date,
    default: Date.now
  },
  listId: {
    type: String,
    required: true
  },
  listName: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  subscribers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscriber'
  }]
});

export default mongoose.model('Campaign', CampaignSchema);