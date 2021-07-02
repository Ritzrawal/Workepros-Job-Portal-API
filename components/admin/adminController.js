const responseHelper = require('./../../helpers/responseHelper');
const crypto = require('crypto');
const User = require('./../../models/user');
const AdminDetail = require('./../../models/adminDetail');
const msg = require('./../../utils/constVariables');
const { nodemailer } = require('../../helpers/nodemailer');
const { awsDeleteFile, awsUpload } = require('../../helpers/awsS3');
const tokenGenerator = require('../../middleware/tokenGenerator');
const moment = require('moment');


const adminController = {};

// add super admin
adminController.addSuperAdmin = async (req, res, next) => {
  try {
    if (await User.findOne({ email: 'workerpros@superadmin.com' })) {
      return responseHelper(false, msg.USER_EMAIL_EXISTS, 409, '', {}, res);
    }
    const user = await User.create({ email: 'workerpros@superadmin.com', password: 'Password@123', role: 'super-admin' });
    await AdminDetail.create({
      user_id: user['_id'],
      permissions: {
        read_messages: true,
        edit_companies: true,
        edit_profiles: true,
        approve: true,
        read_support_messages: true,
      },
      first_name: 'super',
      last_name: 'admin'
    });
    return responseHelper(true, msg.USER_ADDED, 200, '', {}, res);
  } catch (error) {
    logger.error(error);
    return responseHelper(false, msg.SERVER_ERROR, 500, '', {}, res);
  }
};

//add admin
adminController.addAdmin = async (req, res, next) => {
  try {
    if (await User.findOne({ email: req.body.email })) {
      return responseHelper(false, msg.USER_EMAIL_EXISTS, 409, '', {}, res);;
    }
    const user = await User.create({ email: req.body.email, password: req.body.password, role: 'admin' });
    await AdminDetail.create({
      user_id: user['_id'],
      permissions: {
        read_messages: false,
        edit_companies: false,
        edit_profiles: false,
        approve: false,
        read_support_messages: false,
      },
      first_name: req.body.first_name,
      last_name: req.body.last_name
    });

    if (user) {
      return await nodemailer({ user, password: req.body.password }, 'adminCredentials', res) ?
        responseHelper(true, "User Created Successfully", 200, '', {}, res) :
        responseHelper(false, "CREATE USER FAILED", 400, '', {}, res);
    } else {
      return responseHelper(false, { 'email': USER_NOT_FOUND }, 404, 'validation', {}, res);
    }
  } catch (error) {
    logger.error(error);
    return responseHelper(false, msg.SERVER_ERROR, 500, '', {}, res);
  }
};

//admin login
adminController.adminLogin = async (req, res, next) => {
  try {
    const role = req.body.role;

    let user = await User.findOne({ email: req.body['email'].trim() });

    if (!user) {
      return responseHelper(false, 'Invalid Email or Password', 400, '', {}, res);
    }

    if ((user.role == 'admin') || (user.role == 'super-admin')) {

      const sendTokenResponse = async () => {
        user['last_login_at'] = moment();
        user = user.toObject();
        delete user['password'];
        const tokens = await tokenGenerator(user);
        return responseHelper(true, "User successfully logged in", 200, '', tokens, res);
      };

      user ?
        await user.comparePassword(req.body['password']) ?
          await sendTokenResponse() :
          await responseHelper(false, { 'password': "Enter correct password" }, 400, 'validation', {}, res) :
        await responseHelper(false, { 'email': msg.USER_NOT_FOUND }, 400, 'validation', {}, res);

    } else {
      return responseHelper(false, 'Invalid Email or Password', 400, '', {}, res);
    }
  } catch (error) {
    logger.error(error);
    return responseHelper(false, msg.SERVER_ERROR, 500, '', {}, res);
  }
};

//admin update profile 
adminController.adminUpdateProfile = async (req, res, next) => {
  try {
    const user_id = req.user.user_id;
    const files = req.files;
    const adminDetail = await AdminDetail.findOne({ user_id })
    if (adminDetail) {
      if (files && files['profile_image']) {
        const current_date = Date.now();
        /* Handling profile update */
        adminDetail['profile_image'] && await awsDeleteFile(adminDetail['profile_image']);

        const profile_image = files['profile_image'];

        const image_path = `profile_image_${current_date}.${profile_image.mimetype.split('/').pop()}`;
        await awsUpload(profile_image.data, image_path);
        /* Updating the path */
        adminDetail['profile_image'] = image_path;
      }
      adminDetail['first_name'] = (req.body['first_name']);
      adminDetail['last_name'] = (req.body['last_name']);
      await adminDetail.save();
      return responseHelper(true, msg.PROFILE_UPDATED, 200, '', adminDetail, res);
    } else {
      return responseHelper(false, msg.USER_NOT_FOUND, 404, '', {}, res);
    }

  } catch (error) {
    logger.error(error);
    return responseHelper(false, msg.SERVER_ERROR, 500, '', {}, res);
  }
};


//grant permissions to admin
adminController.grantPermission = async (req, res, next) => {
  try {
    const user_id = req.query.user_id;
    const { read_messages, edit_companies, edit_profiles, approve, read_support_messages } = req.body;
    const grantPermission = await AdminDetail.findByIdAndUpdate(user_id, { $set: { permissions: { read_messages: read_messages, edit_companies: edit_companies, edit_profiles: edit_profiles, approve: approve, read_support_messages: read_support_messages } } })
    return responseHelper(true, 'Permissions granted successfully', 200, '', req.body, res);

  } catch (error) {
    logger.error(error);
    return responseHelper(false, msg.SERVER_ERROR, 500, '', {}, res);
  }
};


module.exports = adminController;
