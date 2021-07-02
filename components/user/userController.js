const responseHelper = require('../../helpers/responseHelper');
const crypto = require('crypto');
const { User, ForgotPasswordToken, WorkerDetail, UserFollow, CompanyMember, AdminDetail, Company, Job } = require('../../models');
const moment = require('moment');
const {
  SERVER_ERROR,
  USER_NOT_FOUND,
  MAIL_FAILED,
  UNAUTHORIZED,
  USER_PASSWORD_CHANGED,
  USER_OLD_PASS_NOT_MATCH,
  MAIL_SUCCESS,
  PROFILE_UPDATED,
  PROFILE_RETRIEVED,
  USER_SUGGESTION_LIST,
  USER_FOLLOW_ACCEPTED,
  USER_FOLLOW_IGNORED,
  USER_FOLLOW_REQUESTED,
  USER_LIST,
  USER_ADDED,
  USER_EMAIL_EXISTS,
  NOT_FOUND,
  USER_UNFOLLOWED,

} = require('../../utils/constVariables');
const { nodemailer } = require('../../helpers/nodemailer');
const { awsDeleteFile, awsUpload } = require('../../helpers/awsS3');
const { ObjectId } = require('mongoose').Types;


module.exports = {
  // for all users----------------------------------------
  // forgot password send link to mail
  forgotPassword: async (req, res, next) => {
    try {
      const user = await User.findOne({ email: req.body['email'].trim() });
      if (user) {
        const token = await generateForgotPassToken();

        const forgotPasswordToken = await ForgotPasswordToken.findOne({ user_id: user['_id'] });
        if (forgotPasswordToken) {
          forgotPasswordToken['token'] = token;
        }

        const expires_at = moment().add(process.env.FORGOT_PASS_TOKEN_EXPIRES_AT, 'd');
        const newForgotPasswordToken = new ForgotPasswordToken({ token, user_id: user['_id'], expires_at });

        forgotPasswordToken ?
          await forgotPasswordToken.save() :
          await newForgotPasswordToken.save();

        return await nodemailer({ user, token }, 'forgotPassword', res) ?
          responseHelper(true, MAIL_SUCCESS, 200, '', {}, res) :
          responseHelper(false, MAIL_FAILED, 400, '', {}, res);
      } else {
        return responseHelper(false, { 'email': USER_NOT_FOUND }, 404, 'validation', {}, res);
      }
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  // change password of a user from forgot password
  changePassword: async (req, res, next) => {
    try {
      const token = req.body['authorization'] || '';
      const userForgotPassTok = await ForgotPasswordToken.findOne({ token });
      if (userForgotPassTok && token) {
        const user = await User.findOne({ _id: userForgotPassTok.user_id });
        if (user) {
          user['password'] = req.body['password'];
          await user.save();
          await userForgotPassTok.remove();
          return responseHelper(true, USER_PASSWORD_CHANGED, 200, '', {}, res);
        }
      } else {
        return responseHelper(false, UNAUTHORIZED, 401, '', {}, res);
      }
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  // change password of a user from setting
  changePasswordSetting: async (req, res, next) => {
    try {
      const user = await User.findOne({ _id: req.user['user_id'] });
      if (user) {
        const match = await user.comparePassword(req.body['old_password']);
        console.log(req.body);
        if (!match) {
          return responseHelper(false, { 'old_password': USER_OLD_PASS_NOT_MATCH }, 400, 'validation', {}, res);
        } else {
          user['password'] = req.body['new_password'];
          await user.save();
          return responseHelper(true, USER_PASSWORD_CHANGED, 200, '', {}, res);
        }
      }
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  viewOthersProfile: async (req, res, next) => {
    try {
      const workerDetail = await WorkerDetail.findOne({ user_id: req.params['user_id'] }).select('user_id certificates first_name last_name categories work_experience profile_image');

      if (workerDetail) {
        return responseHelper(true, PROFILE_RETRIEVED, 200, '', workerDetail, res);
      } else {
        return responseHelper(false, NOT_FOUND, 404, '', {}, res);
      }
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  // for workers------------------------------------------
  workerGetUserSuggestions: async (req, res, next) => {
    try {
      const userSuggestions = await WorkerDetail.find({ active: true, user_id: { $ne: req.user.user_id } }).select('first_name last_name profile_image user_id').lean();
      return responseHelper(true, USER_SUGGESTION_LIST, 200, '', userSuggestions, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  // worker get profile information
  workerGetProfileInfo: async (req, res, next) => {
    try {
      const workerDetail = await WorkerDetail.findOne({ user_id: req.user['user_id'] }).select('user_id certificates first_name last_name categories work_experience work_preferences profile_image created_at address.city travel_will')
        .populate({ path: 'user', select: 'email' });
      if (workerDetail['user']) {
        return responseHelper(true, PROFILE_RETRIEVED, 200, '', workerDetail, res);
      } else {
        return responseHelper(false, USER_NOT_FOUND, 404, '', {}, res);
      }
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  // worker update profile general
  workerUpdateProfileGeneral: async (req, res, next) => {
    try {
      const workerDetail = await WorkerDetail.findOne({ user_id: req.user['user_id'] });
      const files = req.files;
      if (workerDetail) {
        if (files && files['profile_image']) {
          const current_date = Date.now();
          /* Handling profile update */
          workerDetail['profile_image'] && await awsDeleteFile(workerDetail['profile_image']);

          const profile_image = files['profile_image'];

          // profile_image.mv(`${appDir}/../public/profiles/profile_image_${current_date}.${profile_image.mimetype.split('/').pop()}`);
          const image_path = `profile_image_${current_date}.${profile_image.mimetype.split('/').pop()}`;
          await awsUpload(profile_image.data, image_path);
          /* Updating the path */
          workerDetail['profile_image'] = image_path;
        }
        workerDetail['address'] = JSON.parse(req.body['address']);
        workerDetail['travel_will'] = JSON.parse(req.body['travel_will']);
        await workerDetail.save();
        return responseHelper(true, PROFILE_UPDATED, 200, '', workerDetail, res);
      } else {
        return responseHelper(false, USER_NOT_FOUND, 404, '', {}, res);
      }
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  // worker update profile trade and skills
  workerUpdateProfileTradesAndSkills: async (req, res, next) => {
    try {
      const workerDetail = await WorkerDetail.findOne({ user_id: req.user['user_id'] });
      if (workerDetail) {
        workerDetail['categories'] = req.body['categories'];
        await workerDetail.save();

        return responseHelper(true, PROFILE_UPDATED, 200, '', workerDetail, res);
      } else {
        return responseHelper(false, USER_NOT_FOUND, 404, '', {}, res);
      }
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  // worker update profile  experience
  workerUpdateProfileWorkAndExperience: async (req, res, next) => {
    try {
      const workerDetail = await WorkerDetail.findOne({ user_id: req.user['user_id'] });
      if (workerDetail) {
        workerDetail['work_experience'] = req.body['work_experience'];
        await workerDetail.save();

        return responseHelper(true, PROFILE_UPDATED, 200, '', workerDetail, res);
      } else {
        return responseHelper(false, USER_NOT_FOUND, 404, '', {}, res);
      }
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  // worker update profileCertificates
  workerUpdateProfileCertificates: async (req, res, next) => {
    try {
      const workerDetail = await WorkerDetail.findOne({ user_id: req.user['user_id'] });
      if (workerDetail) {
        workerDetail['certificates'] = req.body['certificates'];
        await workerDetail.save();
        return responseHelper(true, PROFILE_UPDATED, 200, '', workerDetail, res);
      } else {
        return responseHelper(false, USER_NOT_FOUND, 404, '', {}, res);
      }
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  // worker update work and preferences
  workerUpdateProfileWorkAndPreferences: async (req, res, next) => {
    try {
      const workerDetail = await WorkerDetail.findOne({ user_id: req.user['user_id'] });
      if (workerDetail) {
        workerDetail['work_preferences'] = req.body['work_preferences'];
        await workerDetail.save();
        return responseHelper(true, PROFILE_UPDATED, 200, '', workerDetail, res);
      } else {
        return responseHelper(false, USER_NOT_FOUND, 404, '', {}, res);
      }
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  workerFollowUpdate: async (req, res, next) => {
    try {
      if (req.params['status'] = 'unfollow') {
        await UserFollow.deleteOne({ follower_id: req.user['user_id'], following_id: ObjectId(req.params['user_id']), status: 'accepted' });
        return responseHelper(true, USER_UNFOLLOWED, 200, '', {}, res);
      }
      const userFollow = await UserFollow.findOne({ follower_id: req.user['user_id'], following_id: ObjectId(req.params['user_id']), status: 'requested' });
      if (userFollow) {
        userFollow['status'] = req.params['status'];
        await userFollow.save();
        return responseHelper(true, userFollow['status'] = 'accepted' ? USER_FOLLOW_ACCEPTED : USER_FOLLOW_IGNORED, 200, '', {}, res);
      } else {
        await UserFollow.create({ follower_id: req.user['user_id'], following_id: ObjectId(req.params['user_id']) });
        return responseHelper(true, USER_FOLLOW_REQUESTED, 200, '', {}, res);
      }
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },



  workerGetFollows: async (req, res, next) => {
    try {
      const userFollows = await UserFollow.find({ following_id: req.user['user_id'], status: req.params['status'] });
      return responseHelper(true, USER_LIST, 200, '', userFollows, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },


  // for employers----------------------------------------
  employerAddTeamMember: async (req, res, next) => {
    try {
      const newUser = await User.create({
        password: 'Password@123',
        role: 'employer-member',
        email: req.body['email'],
      });
      await CompanyMember.create({
        first_name: req.body['first_name'],
        last_name: req.body['last_name'],
        user_id: newUser['_id'],
        company_id: req.user['company_id'],
        created_by: req.user['user_id'],
        permissions: {
          home: req.body.home,
          view_edit_jobs: req.body.view_edit_jobs,
          manage_candidates: req.body.manage_candidates,
          post_new_jobs: req.body.post_new_jobs,
          post_jobs: req.body.post_jobs,
          messages: req.body.messages,
          calender: req.body.calender,
          subcontractor: req.body.sub_contractor,
          company_settings: req.body.company_settings,
          add_remove_staff: req.body.add_remove_staff,
          manage_subscription: req.body.manage_subscription,
          view_update_billing: req.body.view_update_billing,
        }
      });
      if (newUser) {
        return await nodemailer({ newUser, password: 'Password@123' }, 'companyMemberCredentials', res) ?
          responseHelper(true, "User Created Successfully", 200, '', {}, res) :
          responseHelper(false, "CREATE USER FAILED", 400, '', {}, res);
      } else {
        return responseHelper(false, { 'email': USER_NOT_FOUND }, 404, 'validation', {}, res);
      }
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  employerGetTeamMembers: async (req, res, next) => {
    try {
      const select = 'email account_verified active role email created_at _id'
      const team = await User.find({ role: 'employer-member' }).select(select).populate({ path: 'user', select: 'first_name last_name profile_image permissions' })
      responseHelper(true, "Data retrieved Successfully", 200, '', team, res);

    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  employerGetParticularMember: async (req, res, next) => {
    try {
      const member_id = req.query.member_id;
      const select = 'email account_verified active role email created_at _id'
      const team = await User.find({ _id: member_id }).select(select).populate({ path: 'user', select: 'first_name last_name profile_image permissions' })
      responseHelper(true, "Data retrieved Successfully", 200, '', team, res);

    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  employerGetProfileInfo: async (req, res, next) => {
    try {
      const employer = await CompanyMember.findOne({ user_id: req.user['user_id'] }).lean();
      const employerCompany = await Company.findOne({ _id: req.user['company_id'] }).lean();
      const responseData = {
        user: employer,
        company: employerCompany,
      };
      return responseHelper(true, 'user retrieved success', 200, '', responseData, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  employerGetUserSuggestions: async (req, res, next) => {
    try {
      const workers = await WorkerDetail.find({ active: true }).select('first_name last_name profile_image categories address created_at work_experience work_preferences user_id').lean();
      return responseHelper(true, 'user retrieved success', 200, '', workers, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  employerLikeUserProfile: async (req, res, next) => {
    try {
      const profile_id = req.params.candidate_id;
      const employerDetails = await CompanyMember.findOne({ user_id: req.user.user_id })
      const already_disliked = await CompanyMember.findOne({ user_id: req.user.user_id, dislike_profiles: { $in: [profile_id] } });
      const already_liked = await CompanyMember.findOne({ user_id: req.user.user_id, like_profiles: { $in: [profile_id] } });

      if (already_liked) {
        employerDetails['like_profiles'].pull(profile_id);
        await employerDetails.save();
        return responseHelper(true, 'Remove Like', 200, '', {}, res);
      }
      if (already_disliked) {
        employerDetails['dislike_profiles'].pull(profile_id);
      }
      employerDetails['like_profiles'].push(profile_id);
      await employerDetails.save();
      return responseHelper(true, 'Like User Profile', 200, '', {}, res);

    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  employerDislikeUserProfile: async (req, res, next) => {
    try {
      const profile_id = req.params.candidate_id;
      const employerDetails = await CompanyMember.findOne({ user_id: req.user.user_id })
      const already_disliked = await CompanyMember.findOne({ user_id: req.user.user_id, dislike_profiles: { $in: [profile_id] } });
      const already_liked = await CompanyMember.findOne({ user_id: req.user.user_id, like_profiles: { $in: [profile_id] } });

      if (already_disliked) {
        employerDetails['dislike_profiles'].pull(profile_id);
        await employerDetails.save();
        return responseHelper(true, 'Remove Dislike', 200, '', {}, res);
      }

      if (already_liked) {
        employerDetails['like_profiles'].pull(profile_id);
      }

      employerDetails['dislike_profiles'].push(profile_id);
      await employerDetails.save();
      return responseHelper(true, 'Dislike User Profile', 200, '', {}, res);

    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  // for admins-------------------------------------------
  // get workers for admin portal
  addSuperAdmin: async (req, res, next) => {
    try {
      if (await User.findOne({ email: 'workerpros@superadmin.com' })) {
        return responseHelper(false, USER_EMAIL_EXISTS, 409, '', {}, res);;
      }
      const user = await User.create({ email: 'workerpros@superadmin.com', password: 'Password@123' });
      await AdminDetail.create({
        user_id: user['_id'],
        permissions: {
          read_messages: true,
          edit_companies: true,
          edit_profiles: true,
          approve: true,
        }
      });
      return responseHelper(true, USER_ADDED, 200, '', {}, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  adminAddAdmin: async (req, res, next) => {
    try {

    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  searchUserCandidate: async (req, res, next) => {
    try {
      const searchUser = await WorkerDetail.find({
        $or: [{ 'first_name': { '$regex': req.params.name, '$options': 'i' } }, { 'last_name': { '$regex': req.params.name, '$options': 'i' } }]
      })
      const searchEmp = await CompanyMember.find({
        $or: [{ 'first_name': { '$regex': req.params.name, '$options': 'i' } }, { 'last_name': { '$regex': req.params.name, '$options': 'i' } }]
      })
      const searchCompany = await Company.find({
        'company_name': { '$regex': req.params.name, '$options': 'i' }
      })
      const searchJob = await Job.find({
        'title': { '$regex': req.params.name, '$options': 'i' }
      })

      const searchData = { searchUser, searchEmp, searchCompany, searchJob };

      return responseHelper(true, "Data retrieved successfully", 200, '', searchData, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  searchUserEmployer: async (req, res, next) => {
    try {
      const user_id = req.user.user_id;
      const company = await CompanyMember.findOne({ user_id: user_id }, 'company_id');

      const searchUser = await WorkerDetail.find({
        $or: [{ 'first_name': { '$regex': req.params.name, '$options': 'i' } }, { 'last_name': { '$regex': req.params.name, '$options': 'i' } }]
      })
      const searchEmp = await CompanyMember.find({
        $and: [{ company_id: company.company_id }, { $or: [{ 'first_name': { '$regex': req.params.name, '$options': 'i' } }, { 'last_name': { '$regex': req.params.name, '$options': 'i' } }] }]
      })
      const searchJob = await Job.find({
        $and: [{ company_id: company.company_id }, { 'title': { '$regex': req.params.name, '$options': 'i' } }]
      })

      const searchData = { searchUser, searchEmp, searchJob };

      return responseHelper(true, "Data retrieved successfully", 200, '', searchData, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  adminGetWorkers: async (req, res, next) => {
    try {
      const users = await User.findAll({ role: 'worker' });
      const userIds = await Promise.all(
        users.map(async (user) => {
          return user['_id'];
        }),
      );
      const workers = await WorkerDetail.findAll({ user_id: userIds });
      return responseHelper(true, USER_LIST, 200, '', workers, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
};

const generateForgotPassToken = async () => {
  const token = crypto.randomBytes(32).toString('hex');
  const forgotPasswordToken = await ForgotPasswordToken.findOne({ token });

  return !forgotPasswordToken ?
    token :
    generateForgotPassToken();
};

const generateAdminToken = async () => {
  const token = crypto.randomBytes(32).toString('hex');
  const adminToken = await AdminToken.findOne({ token });

  return !adminToken ?
    token :
    generateAdminToken();
};
