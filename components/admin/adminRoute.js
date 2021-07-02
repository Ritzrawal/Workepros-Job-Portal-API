const inputValidation = require('./../../helpers/inputValidation');
const adminController = require('./adminController');

module.exports = (router, passport) => {
  //add super admin
  router.post('/admin/superadmin/add', adminController.addSuperAdmin);

  //add admin
  router.post('/admin/addAdmin', passport.authenticate('bearer', { session: false }), inputValidation.adminValidation, inputValidation.addAdminValidation, adminController.addAdmin);

  //admin login
  router.post('/admin/sign-in', inputValidation.adminSignInValidation, adminController.adminLogin);

  //update admin profile 
  router.post('/admin/updateProfile', passport.authenticate('bearer', { session: false }), inputValidation.adminValidation, adminController.adminUpdateProfile);

  // //get all admin
  // router.get('/admin/getAdmin/all', passport.authenticate('bearer', { session: false }), inputValidation.adminValidation, adminController.getAdminAll);

  // //get particular admin
  // router.get('/admin/getParticularAdmin/:user_id', passport.authenticate('bearer', { session: false }), inputValidation.adminValidation, adminController.getAdminAll);

  //admin grant permission
  router.put('/admin/grant-permission', passport.authenticate('bearer', { session: false }), inputValidation.superAdminValidation, adminController.grantPermission)
};
