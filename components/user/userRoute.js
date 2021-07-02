const {
  forgotPasswordValidation,
  changePasswordValidation,
  settingChangePasswordValidation,
  profileUpdateGeneralValidation,
  profileUpdateTradesAndSkillsValidation,
  profileUpdateWorkExpValidation,
  profileUpdateCertificatesValidation,
  profileUpdateWorkPreferenceValidation,
  workerValidation,
  employerValidation,
  adminValidation,
  addTeamMemberValidation,
  getMemeberValidation
} = require('../../helpers/inputValidation');
const UserController = require('./userController');


module.exports = (router, passport) => {
  router.get('/add-super-admin', UserController.addSuperAdmin);

  // for all users
  router.post('/forgot-password', forgotPasswordValidation, UserController.forgotPassword);
  router.post('/change-password', changePasswordValidation, UserController.changePassword);
  router.post('/change-password-setting', passport.authenticate('bearer', { session: false }), settingChangePasswordValidation, UserController.changePasswordSetting);
  router.get('/view-profile/:user_id', passport.authenticate('bearer', { session: false }), UserController.viewOthersProfile);


  // for workers
  router.put('/worker/update-profile-general', passport.authenticate('bearer', { session: false }), workerValidation, profileUpdateGeneralValidation, UserController.workerUpdateProfileGeneral);
  router.put('/worker/update-profile-trade', passport.authenticate('bearer', { session: false }), workerValidation, profileUpdateTradesAndSkillsValidation, UserController.workerUpdateProfileTradesAndSkills);
  router.put('/worker/update-profile-work', passport.authenticate('bearer', { session: false }), workerValidation, profileUpdateWorkExpValidation, UserController.workerUpdateProfileWorkAndExperience);
  router.put('/worker/update-profile-cert', passport.authenticate('bearer', { session: false }), workerValidation, profileUpdateCertificatesValidation, UserController.workerUpdateProfileCertificates);
  router.put('/worker/update-profile-work-pref', passport.authenticate('bearer', { session: false }), workerValidation, profileUpdateWorkPreferenceValidation, UserController.workerUpdateProfileWorkAndPreferences);
  router.get('/worker/profile-info', passport.authenticate('bearer', { session: false }), workerValidation, UserController.workerGetProfileInfo);
  router.get('/worker/get-user-suggestions', passport.authenticate('bearer', { session: false }), workerValidation, UserController.workerGetUserSuggestions);
  router.get('/worker/connect/:user_id/:status', passport.authenticate('bearer', { session: false }), workerValidation, UserController.workerFollowUpdate);
  router.get('/worker/follows/:status', passport.authenticate('bearer', { session: false }), workerValidation, UserController.workerGetFollows);
  // router.post('/worker/connect/request/:following_id', passport.authenticate('bearer', {session: false}), workerValidation, userController.userConnectRequest);
  router.get('/worker/search/:name', passport.authenticate('bearer', { session: false }), workerValidation, UserController.searchUserCandidate);

  // for employers
  router.post('/employer/add-team-member', passport.authenticate('bearer', { session: false }), employerValidation, addTeamMemberValidation, UserController.employerAddTeamMember);
  router.get('/employer/getTeamMembers', passport.authenticate('bearer', { session: false }), employerValidation, UserController.employerGetTeamMembers);
  router.get('/employer/getTeamMember/:member_id', passport.authenticate('bearer', { session: false }), employerValidation, getMemeberValidation, UserController.employerGetParticularMember);
  router.get('/employer/get-user-suggestions', passport.authenticate('bearer', { session: false }), employerValidation, UserController.employerGetUserSuggestions);
  router.get('/employer/get-profile-info', passport.authenticate('bearer', { session: false }), employerValidation, UserController.employerGetProfileInfo);
  router.get('/employer/search/:name', passport.authenticate('bearer', { session: false }), employerValidation, UserController.searchUserEmployer);
  router.post('/employer/like-Profile/:candidate_id', passport.authenticate('bearer', { session: false }), employerValidation, UserController.employerLikeUserProfile);
  router.post('/employer/unlike-Profile/:candidate_id', passport.authenticate('bearer', { session: false }), employerValidation, UserController.employerDislikeUserProfile);

  // for admins
  router.get('/admin/get-workers', passport.authenticate('bearer', { session: false }), adminValidation, UserController.adminGetWorkers);
  // router.get('/admin/profile-info',  passport.authenticate('bearer', {session: false}), WorkerValidation, UserController.getProfileInfo);
  router.get('/admin/add-admin', passport.authenticate('bearer', { session: false }), adminValidation, UserController.adminAddAdmin);
  // router.get('/admin/remove-admin',  passport.authenticate('bearer', {session: false}), WorkerValidation, UserController.getProfileInfo);
  // router.get('/admin/update-admin',  passport.authenticate('bearer', {session: false}), WorkerValidation, UserController.getProfileInfo);
};

