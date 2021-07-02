const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const refreshTokenSchema = new mongoose.Schema(
    {
      refresh_token_id: {
        type: String,
        required: true,
      },
      access_token_id: {
        type: String,
        ref: 'AccessToken',
        required: true,
      },
      user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      expires_at: {
        type: Date,
        required: true,
        expires: 5 * 24 * 60 * 60,
      },
    },
    {
      timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'},
      underscore: true,
    });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
