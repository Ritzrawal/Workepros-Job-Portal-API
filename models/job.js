const mongoose = require('mongoose');
const moment = require('moment');

const workTime = {
  start: {
    type: String,
  },
  end: {
    type: String,
  },
  off: {
    type: String,
  },
};

const jobSchema = new mongoose.Schema(
    {
      title: {
        type: String,
      },
      summary: {
        type: String,
      },
      responsibilities: {
        type: String,
      },
      // skill_level: {
      //   type: String,
      // },
      job_type: {
        type: String,
      },
      pay_rate: {
        min: Number,
        max: Number,
        pay_type: String,
      },
      working_schedule: {
        sunday: workTime,
        monday: workTime,
        tuesday: workTime,
        wednesday: workTime,
        thursday: workTime,
        friday: workTime,
        saturday: workTime,
      },
      company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
      },
      categories: [{
        title: {type: String},
        skills: [String],
        desired_experience: {
          type: Number,
        },
      }],
      benefits: [String],
      job_role: [String],
      certificates: [String],
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
      active: {
        type: Boolean,
        default: true,
      },
      phase: {
        type: String,
        enum: ['published', 'draft', 'expired'],
        default: 'draft',
      },
      expires_at: {
        type: Date,
        default: moment().add(30, 'days'),
      },
    },
    {
      timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'},
      underscore: true,
    },
);

jobSchema.virtual('company', {
  ref: 'Company',
  localField: 'company_id',
  foreignField: '_id',
  justOne: true,
});

// tell Mongoose to retrieve the virtual fields
jobSchema.set('toObject', {virtuals: true});
jobSchema.set('toJSON', {virtuals: true});

module.exports = mongoose.model('Job', jobSchema);
