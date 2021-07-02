const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
    {
      message: {
        type: String,
      },
      user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    },
    {
      timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'},
      underscore: true,
    },
);


commentSchema.virtual('user', {
  ref: 'WorkerDetail',
  localField: 'user_id',
  foreignField: 'user_id',
  justOne: true,
});

// tell Mongoose to retrieve the virtual fields
commentSchema.set('toObject', {virtuals: true});
commentSchema.set('toJSON', {virtuals: true});

module.exports = mongoose.model('Comment', commentSchema);
