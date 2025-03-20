import mongoose from 'mongoose';

const SubscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  },
  listId: {
    type: String,
    required: true
  },
  subscriptionDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['subscribed', 'unsubscribed', 'cleaned', 'pending'],
    default: 'subscribed'
  }
});

export default mongoose.model('Subscriber', SubscriberSchema); 