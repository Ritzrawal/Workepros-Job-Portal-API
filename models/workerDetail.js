const mongoose = require('mongoose');

const workerDetailSchema = new mongoose.Schema(
    {
      first_name: {
        type: String,
      },
      last_name: {
        type: String,
      },
      phone_number: {
        type: String,
        default: '',
      },
      profile_image: {
        type: String,
        default: '',
      },
      address: {
        city: {
          type: String,
          default: '',
        },
        country: {
          type: String,
          default: '',
        },
        state: {
          type: String, default: '',
        },
      },
      travel_will: {
        distance: {
          type: Number,
          default: '',
        },
        high_demand_city: {
          type: String, default: '',
        },
      },
      categories: [{
        title: {type: String},
        experience_time: {type: Number},
        skills: [String],
        is_primary: {type: Boolean, default: false},
      }],
      work_experience: [{
        company_name: {type: String},
        role: {type: String},
        company_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Company',
          default: null},
        from: {
          year: Number,
          month: String,
        },
        to: {
          year: Number,
          month: String,
        },
        description: {type: String, default: ''},
        currently_work: {type: Boolean, default: false},
        categories: [{type: String}],
        other_worked_category: {type: Boolean, default: false},
      }],
      certificates: [{type: String, default: ''}],
      work_preferences: {
        benefits: [{type: String, default: ''}],
        job_type: [{type: String, default: ''}],
        company_size: [{type: String, default: ''}],
        development_type: [{type: String, default: ''}],
      },
      user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      active: {
        type: Boolean,
        default: true,
      },
      fav_jobs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
      }],
      saved_jobs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
      }],
      followed_companies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
      }],
      saved_companies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
      }],
    },
    {
      timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'},
      underscore: true,
    },
);

workerDetailSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true,
});

workerDetailSchema.virtual('user.saved_jobs', {
  ref: 'Job',
  localField: 'saved_jobs',
  foreignField: '_id',
});

// tell Mongoose to retrieve the virtual fields
workerDetailSchema.set('toObject', {virtuals: true});
workerDetailSchema.set('toJSON', {virtuals: true});

module.exports = mongoose.model('WorkerDetail', workerDetailSchema);
