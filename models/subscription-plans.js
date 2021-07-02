const mongoose = require('mongoose');


const subscriptionPlanSchema = new mongoose.Schema({
  duration: { type: String, enum: ['MONTHLY', 'ANUALLY'], default: 'MONTHLY', required: true },
  plan: { type: String, enum: ['STANDARD', 'BUSINESS','PREMIUM'], default: 'STANDARD', required: true},
  price: {type: Number, require: true},
  job_limit: {type: Number, required: true},
  features: {type: [String], required: true},
  added_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  added_at: { type: Date, required: true },
  updated_at: { type: String },
  updated_by: { type: String }

});

subscriptionPlanSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: 'user_id',
  justOne: true,
});

// tell Mongoose to retrieve the virtual fields
subscriptionPlanSchema.set('toObject', {virtuals: true});
subscriptionPlanSchema.set('toJSON', {virtuals: true});


module.exports = mongoose.model('subscriptionPlan', subscriptionPlanSchema);
