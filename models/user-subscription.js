const mongoose = require('mongoose');

const userSubscriptionSchema = new mongoose.Schema(
    {
      user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      plan_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubscriptionPlan',
        required: true,
      },
      expires_at: {type: Date},
    },
    {
      timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'},
      underscore: true,
    },
);

module.exports = mongoose.model('userSubscription', userSubscriptionSchema);
