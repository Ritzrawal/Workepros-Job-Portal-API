const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
    {
      user_id: {type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      job_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
      },
      company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
      },
      read: {type: Boolean, default: false},
      phase: {type: String, enum: ['interview-requested', 'applied', 'screening', 'interview', 'offered', 'hired', 'declined'], default: 'applied'},
      interview_date: {type: Date, default: null},
    },
    {
      timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'},
      underscore: true,
    },
);

applicationSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true,
});
applicationSchema.virtual('job', {
  ref: 'Job',
  localField: 'job_id',
  foreignField: '_id',
  justOne: true,
});
applicationSchema.virtual('company', {
  ref: 'Company',
  localField: 'company_id',
  foreignField: '_id',
  justOne: true,
});
applicationSchema.virtual('worker_detail', {
  ref: 'WorkerDetail',
  localField: 'user_id',
  foreignField: 'user_id',
  justOne: true,
});
// tell Mongoose to retrieve the virtual fields
applicationSchema.set('toObject', {virtuals: true});
applicationSchema.set('toJSON', {virtuals: true});

module.exports = mongoose.model('Application', applicationSchema);
