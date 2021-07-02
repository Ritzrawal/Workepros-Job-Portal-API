const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cardSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  card_number: { type: Number, required: true },
  name: { type: String, required: true },
  expires_at: { type: Date, required: true },
  address: { type: String, required: true },
  added_at: { type: Date, required: true },
});

module.exports = mongoose.model('cardDetail', cardSchema);

