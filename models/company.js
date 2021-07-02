const mongoose = require('mongoose');

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

const companySchema = new mongoose.Schema(
    {
      company_name: {
        type: String,
        default: '',
      },
      position: {
        type: String,
        default: '',
      },
      license_number: {
        type: String,
        default: '',
      },
      email: {
        type: String,
        default: '',
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
      phone_number: {
        type: String,
        default: '',
      },
      year_founded: {
        type: String,
      },
      company_type: [String],
      company_size: {
        type: String,
        default: '',
      },
      overview: {
        type: String,
        default: '',
      },
      profile_image: {
        type: String,
        default: '',
      },
      images: [{
        type: String,
        default: '',
      }],
      categories: [{
        title: {type: String},
        skills: [String],
      }],
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
          type: String,
          default: '',
        },
      },
      website: {
        type: String,
        default: '',
      },
      user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      active: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'},
      underscore: true,
    },
);

companySchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true,
});

// tell Mongoose to retrieve the virtual fields
companySchema.set('toObject', {virtuals: true});
companySchema.set('toJSON', {virtuals: true});

module.exports = mongoose.model('Company', companySchema);
