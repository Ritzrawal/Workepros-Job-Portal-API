const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subscriberSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subscription_plan: { type: mongoose.Schema.Types.ObjectId, ref: 'subscriptionPlan', required: true },
  plan_status: { type: String, enum: ['SUBSCRIBED', 'RENEWED', 'EXPIRED', 'UPGRADED', 'PENDING'], default: 'PENDING' },
  expires_at: { type: Date },
  price: { type: Number, required: true },
  added_at: { type: Date, required: true },
  updated_at: { type: Date },
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('subscriber', subscriberSchema);

