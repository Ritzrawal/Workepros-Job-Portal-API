const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subHistorySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subscription_plan: { type: mongoose.Schema.Types.ObjectId, ref: 'subscriptionPlan', required: true },
  subscriber_id: { type: mongoose.Schema.Types.ObjectId, ref: 'subscriber', },
  price: { type: Number, required: true },
  status: { type: String, required: true },
  expires_at: { type: Date, required: true },
  type: { type: String, required: true },
  date: { type: Date, required: true },
  sessionId: { type: String, required: true },
  card_number: { type: String}
});

module.exports = mongoose.model('subscribeHistory', subHistorySchema);

