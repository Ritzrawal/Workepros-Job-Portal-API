const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema(
  {
    general: {
      home: { type: Boolean, default: false },
      manage_jobs: {
        view_edit_jobs: { type: Boolean, default: false },
        manage_candidates: { type: Boolean, default: false },
        post_new_job: { type: Boolean, default: false },
      },
      post_jobs: { type: Boolean, default: false },
      messages: { type: Boolean, default: false },
      calander: { type: Boolean, default: false },
      sub_contractor: { type: Boolean, default: false },
    },
    administration: {
      company_settings: { type: Boolean, default: false },
      edit_permissions: {
        add_remove_staff: { type: Boolean, default: false },
      },
      manage_subscription: { type: Boolean, default: false },
      view_update_billing: { type: Boolean, default: false },
    },

    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    underscore: true,
  },
);

module.exports = mongoose.model('permission', permissionSchema);
