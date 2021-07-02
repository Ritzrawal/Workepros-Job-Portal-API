const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const forgotPasswordTokenSchema = new mongoose.Schema(
    {
      token: {
        type: String,
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
        expires: 600,
      },
    },
    {
      timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'},
      underscore: true,
    });

module.exports = mongoose.model('ForgotPasswordToken', forgotPasswordTokenSchema); ;
