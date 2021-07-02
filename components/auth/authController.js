const responseHelper = require('../../helpers/responseHelper');
const tokenGenerator = require('../../middleware/tokenGenerator');
const { User, RefreshToken, Company, WorkerDetail, CompanyMember, AccessToken } = require('../../models');
const download = require('image-downloader');
const { awsUpload } = require('../../helpers/awsS3');
const moment = require('moment');
const {
  SERVER_ERROR,
  AUTH_SUCCESS,
  USER_NOT_FOUND,
  USER_PASS_NOT_MATCH,
  USER_ADDED,
  LOGOUT_SUCCESS,
  TOKEN_EXIST,
  TOKEN_NOT_EXIST,
  USER_EMAIL_EXISTS,
} = require('../../utils/constVariables');
const { trimAndLowCase } = require('../../helpers/manipulation');
const path = require('path');
const fs = require('fs');
const appDir = path.dirname(require.main.filename);
module.exports = {
  // sign up controller
  signUp: async (req, res, next) => {
    try {
      let user = new User({
        email: req.body['email'].trim(),
        password: req.body['password'],
        role: req.body['role'].trim(),
        account_verified: req.body['role'].trim() == 'employer' ? false : true,
      });
      if (req.body['role'].trim() == 'employer') {
        await createDefaultCompany(req, user['_id']);
      } else {
        await createDefaultWorkerDetail(req, user['_id']);
      }
      await user.save();
      user = user.toObject();
      delete user['password'];
      const tokens = await tokenGenerator(user);
      return responseHelper(true, USER_ADDED, 200, '', tokens, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  // sign in controller for sigin
  signIn: async (req, res, next) => {
    try {
      let user = await User.findOne({
        email: req.body['email'].trim(),
      });

      if (!user) {
        return responseHelper(false, 'Enter a valid email', 400, '', {}, res);
      };

      if ((user.role == 'admin') || (user.role == 'super-admin')) {
        return responseHelper(false, 'Only woker and employer can log in', 400, '', {}, res);
      };

      const sendTokenResponse = async () => {
        user['last_login_at'] = moment();
        user = user.toObject();
        delete user['password'];
        const tokens = await tokenGenerator(user);
        return responseHelper(true, AUTH_SUCCESS, 200, '', tokens, res);
      };

      user ?
        await user.comparePassword(req.body['password']) ?
          await sendTokenResponse() :
          await responseHelper(false, { 'password': USER_PASS_NOT_MATCH }, 400, 'validation', {}, res) :
        await responseHelper(false, { 'email': USER_NOT_FOUND }, 400, 'validation', {}, res);

    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  //google auth controller
  authGoogle: async (req, res, next) => {
    try {
      const user = await User.findOne({
        auth_provider: 'google',
        profile_id: req.body['profile_id'],
      });


      const sendTokenResponse = async (user, user_type) => {
        user['last_login_at'] = moment();
        user = user.toObject();
        delete user['password'];
        user.new_user = user_type == 'old_user' ? false : true

        const tokens = await tokenGenerator(user);
        return responseHelper(true, AUTH_SUCCESS, 200, '', tokens, res);
      };

      const userWithThisEmail = async () => {
        const user = await User.findOne({ email: req.body['email'] });
        if (user) {
          await sendTokenResponse(user,'old_user');
        } else {
          const newUser = await createNewGoogleUser(req);
          await sendTokenResponse(newUser,'new_user');
        }
      };

      user ?
        await sendTokenResponse(user,'old_user') :
        await userWithThisEmail();
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  // google sign in
  googleSignIn: async (req, res, next) => {
    try {
      const user = await User.findOne({ auth_provider: 'google', profile_id: req.body['profile_id'] });

      const sendTokenResponse = async (user) => {
        user['last_login_at'] = moment();
        user = user.toObject();
        delete user['password'];
        const tokens = await tokenGenerator(user);
        return responseHelper(true, AUTH_SUCCESS, 200, '', tokens, res);
      };

      if (!user) {
        return responseHelper(false, USER_NOT_FOUND, 400, '', {}, res);
      }
      const login = await sendTokenResponse(user);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  // google sign up
  googleSignUp: async (req, res, next) => {
    try {
      const user = await User.findOne({ email: req.body['email'] });

      const sendTokenResponse = async (user) => {
        user['last_login_at'] = moment();
        user = user.toObject();
        delete user['password'];
        const tokens = await tokenGenerator(user);
        return responseHelper(true, AUTH_SUCCESS, 200, '', tokens, res);
      };

      if (user) {
        return responseHelper(false, USER_EMAIL_EXISTS, 400, '', {}, res);
      } else {
        const newUser = await createNewGoogleUser(req);
        await sendTokenResponse(newUser);
      }
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  // logout controller
  logout: async (req, res, next) => {
    try {
      await req.user.remove();
      await RefreshToken.remove({ access_token_id: req.user['access_token_id'] });
      return responseHelper(true, LOGOUT_SUCCESS, 200, '', {}, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, 'SERVER_ERROR', 500, '', {}, res);
    }
  },

  // to check if token exist or not
  checkToken: async (req, res, next) => {
    try {
      if (await AccessToken.findOne({ access_token_id: req.body['access_token'] })) {
        return responseHelper(true, TOKEN_EXIST, 200, '', {}, res);
      }
      return responseHelper(false, TOKEN_NOT_EXIST, 400, '', {}, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, 'SERVER_ERROR', 500, '', {}, res);
    }
  },
};

// creates new user from google
const createNewGoogleUser = async (req) => {
  // creating new account for google user
  let image_path = null;
  const current_date = Date.now();

  if (req.body['profile_image']) {
    image_path = `public/profile_image_${current_date}.jpeg`;
    const options = {
      url: req.body['profile_image'],
      dest: image_path,
    };
    download.image(options).then(async ({ filename }) => {
      const fileContent = fs.readFileSync(`${appDir}/../${filename}`);
      await awsUpload(fileContent, image_path.replace('public/', ''), 'image/jpeg');
      console.log('file uploaded', filename);
      fs.unlink(`${appDir}/../${filename}`, () => { });
    }).catch((err) => console.error(err));
  }

  const user = new User({
    email: req.body['email'],
    password: null,
    role: req.body['role'],
    auth_provider: 'google',
    profile_id: req.body['profile_id'],
    account_verified: req.body['role'] == 'employer' ? false : true,
  });
  await user.save();
  const dbData = user['role'] == 'employer' ? await createDefaultCompany(req, user['_id']) : await createDefaultWorkerDetail(req, user['_id']);
  dbData['profile_image'] = image_path ? image_path.replace('public/', '') : null;
  await dbData.save();

  return user;
};

// creates default company of employer and employer details to company member
const createDefaultCompany = async (req, user_id) => {
  const newCompany = new Company({
    company_name: req.body['company_name'] ? await trimAndLowCase(req.body['company_name']) : '',
    user_id,
  });
  await newCompany.save();
  await CompanyMember.create({
    first_name: req.body['first_name'],
    last_name: req.body['last_name'],
    company_id: newCompany['_id'],
    user_id,
    permissions: {
      general: {
        home: true,
        manage_jobs: {
          view_edit_jobs: true,
          manage_candidates: true,
          post_new_jobs: true,
        },
        messages: true,
        calender: true,
        subcontractor: true,
      },
      admin: {
        company_settings: true,
        edit_permissions: {
          add_remove_staff: true,
        },
        manage_subscription: true,
        view_update_billing: true,
      },
    },
  });
  return newCompany;
};

// creates default worker detail of worker
const createDefaultWorkerDetail = async (req, user_id) => {
  const workerDetail = new WorkerDetail({
    first_name: req.body['first_name'],
    last_name: req.body['last_name'],
    user_id,
  });
  await workerDetail.save();
  return workerDetail;
}
  ;
