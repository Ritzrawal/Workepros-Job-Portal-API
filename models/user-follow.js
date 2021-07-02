const mongoose = require('mongoose');

const userFollowSchema = new mongoose.Schema({

    follower_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    following_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['REQUEST', 'CANCEL', 'ACCEPT', 'IGNORE'], default: 'REQUEST' },
    created_at: { type: String, required: true },
    updated_at: { type: String },

  });

module.exports = mongoose.model('userFollow', userFollowSchema);
