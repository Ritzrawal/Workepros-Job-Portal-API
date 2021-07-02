const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
    {
      user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      message: {
        type: String,
      },
      files: [String],
      user_likes: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
      ],
      user_comments: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Comment',
          required: true,
        },
      ],
    },
    {
      timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'},
      underscore: true,
    },
);

postSchema.virtual('user', {
  ref: 'WorkerDetail',
  localField: 'user_id',
  foreignField: 'user_id',
  justOne: true,
});
postSchema.virtual('comments', {
  ref: 'Comment',
  localField: 'user_comments',
  foreignField: '_id',
});
// tell Mongoose to retrieve the virtual fields
postSchema.set('toObject', {virtuals: true});
postSchema.set('toJSON', {virtuals: true});

module.exports = mongoose.model('post', postSchema);
