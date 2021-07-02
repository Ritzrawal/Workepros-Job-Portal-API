const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
      for: {
        type: String,
        enum: ['worker', 'employer'],
      },
      message: {
        type: String,
      },
      notification_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      notification_for: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      job_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        default: null,
      },
      notification_type: {
        type: String,
        default: '',
      },
    },
    {
      timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'},
      underscore: true,
    },
);

notificationSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true,
});

// tell Mongoose to retrieve the virtual fields
notificationSchema.set('toObject', {virtuals: true});
notificationSchema.set('toJSON', {virtuals: true});

module.exports = mongoose.model('Notification', notificationSchema);
