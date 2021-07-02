const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const accessTokenSchema = new mongoose.Schema(
    {
      access_token_id: {
        type: String,
        required: true,
      },
      user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    },
    {
      timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'},
      underscore: true,
    });

module.exports = mongoose.model('AccessToken', accessTokenSchema); ;
