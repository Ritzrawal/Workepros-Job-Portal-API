const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new mongoose.Schema(
    {
      sender_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      read: {type: Boolean, default: false},
      ticket: {type: String, enum: ['open', 'resolved']},
      is_admin_deleted: {type: Boolean},
      message: {
        type: String,
        required: true,
      },
      created_at: {
        type: Date,
        required: true,
      },
    },
    {
      // timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'},
      timestamps: false,
      underscore: true,
    });

messageSchema.virtual('sender', {
  ref: 'User',
  localField: 'sender_id',
  foreignField: '_id',
  justOne: true,
});

// tell Mongoose to retrieve the virtual fields
messageSchema.set('toObject', {virtuals: true});
messageSchema.set('toJSON', {virtuals: true});


module.exports = mongoose.model('Message', messageSchema); ;
