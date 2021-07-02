const {employerValidation, adminValidation} = require('../../helpers/inputValidation');
const PermissionController = require('./permissionController');
module.exports = (router, passport) => {
  // for all user------------------------------------

  // for workers-------------------------------------

  // for employers---------------------------------
  router.get('/employer/get-permissions', passport.authenticate('bearer', {session: false}), employerValidation, PermissionController.employerGetPermissions);

  // for admins---------------------------------------
  router.get('/admin/get-permissions', passport.authenticate('bearer', {session: false}), adminValidation, PermissionController.adminGetPermissions);
};

