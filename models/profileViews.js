const mongoose = require('mongoose');

const profileViewSchema = new mongoose.Schema(
    {
      user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      viewer_id: {
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

module.exports = mongoose.model('profileView', profileViewSchema);
