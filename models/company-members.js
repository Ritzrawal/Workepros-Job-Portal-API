const mongoose = require('mongoose');

const companyMemberSchema = new mongoose.Schema(
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
      company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
      },
      like_profiles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }],
      dislike_profiles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }],
      created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      permissions: {
        home: {type: Boolean, default: false},
        view_edit_jobs: {type: Boolean, default: false},
        manage_candidates: {type: Boolean, default: false},
        post_new_jobs: {type: Boolean, default: false},
        post_jobs: {type: Boolean, default: false},
        messages: {type: Boolean, default: false},
        calender: {type: Boolean, default: false},
        subcontractor: {type: Boolean, default: false},
        company_settings: {type: Boolean, default: false},
        add_remove_staff: {type: Boolean, default: false},
        manage_subscription: {type: Boolean, default: false},
        view_update_billing: {type: Boolean, default: false},
      },
    },
    {
      timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'},
      underscore: true,
    },
);

module.exports = mongoose.model('CompanyMember', companyMemberSchema);
