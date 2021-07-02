const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const conversationSchema = new mongoose.Schema(
    {
      conversation_type: {
        type: String,
        enum: ['b-b', 'w-w', 'b-w', 'b-a', 'w-a'],
        required: true,
      },
      messages: [{
        type: Schema.Types.ObjectId,
        ref: 'Message',
        required: false,
      }],
      members: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false,
      }],
      job_id: {
        type: Schema.Types.ObjectId,
        ref: 'Job',
        default: null,
      },
    },
    {
      timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'},
      underscore: true,
    });

conversationSchema.virtual('users', {
  ref: 'WorkerDetail',
  localField: 'members',
  foreignField: 'user_id',
  justOne: false,
});
conversationSchema.virtual('message_list', {
  ref: 'Message',
  localField: 'messages',
  foreignField: '_id',
  justOne: false,
});
conversationSchema.virtual('job', {
  ref: 'Job',
  localField: 'job_id',
  foreignField: '_id',
  justOne: true,
});

// tell Mongoose to retrieve the virtual fields
conversationSchema.set('toObject', {virtuals: true});
conversationSchema.set('toJSON', {virtuals: true});

module.exports = mongoose.model('Conversation', conversationSchema); ;
