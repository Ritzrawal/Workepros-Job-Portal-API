const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
    {
      email: {
        type: String,
        required: true,
        unique: true,
      },
      password: {
        type: String,
      },
      role: {
        type: String,
        enum: ['employer', 'worker', 'admin', 'super-admin', 'employer-member'],
      },
      account_verified: {
        type: Boolean,
        default: false,
      },
      last_login_at: {
        type: Date,
        default: Date.now(),
      },
      active: {
        type: Boolean,
        default: true,
      },
      auth_provider: {
        type: String,
        default: '',
      },
      profile_id: {
        type: String,
        default: '',
      },
    },
    {
      timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'},
      underscore: true,
    },
);

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  this.password = bcrypt.hashSync(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function(candidatePassword, cb) {
  if (!candidatePassword || !this.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.virtual('user', {
  ref: 'CompanyMember',
  localField: '_id',
  foreignField: 'user_id',
  justOne: true,
});

// tell Mongoose to retrieve the virtual fields
userSchema.set('toObject', {virtuals: true});
userSchema.set('toJSON', {virtuals: true});

module.exports = mongoose.model('User', userSchema);
