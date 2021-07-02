const mongoose = require('mongoose');

const adminDetailSchema = new mongoose.Schema(
    {
      first_name: {
        type: String,
        default: '',
      },
      last_name: {
        type: String,
        default: '',
      },
      profile_image: {
        type: String,
        default: '',
      },
      user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      permissions: {
        read_messages: {type: Boolean, default: false},
        edit_companies: {type: Boolean, default: false},
        edit_profiles: {type: Boolean, default: false},
        approve: {type: Boolean, default: false},
        read_support_messages: {type: Boolean, default: false},
      },
    },
    {
      timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'},
      underscore: true,
    },
);

module.exports = mongoose.model('AdminDetail', adminDetailSchema);
