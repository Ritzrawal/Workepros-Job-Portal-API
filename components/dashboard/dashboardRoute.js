const {
  employerValidation, workerValidation, adminValidation,
} = require('../../helpers/inputValidation');
const dashboardController = require('./dashboardController');


module.exports = (router, passport) => {
  // for all users----------------------------------------

  // for workers------------------------------------------
  router.get('/worker/dashboard/data-counts', passport.authenticate('bearer', {session: false}), workerValidation, dashboardController.workerGetDashboardDataCounts);
  // router.get('/worker/dashboard/upcoming-interviews',  passport.authenticate('bearer', {session: false}), employerValidation, dashboardController.workerGetDashboardUpcomingInterviews);


  // for employers----------------------------------------
  router.get('/employer/dashboard/data-counts', passport.authenticate('bearer', {session: false}), employerValidation, dashboardController.employerGetDashboardDataCounts);
  router.get('/employer/dashboard/notifications', passport.authenticate('bearer', {session: false}), employerValidation, dashboardController.employerGetDashboardNotifications);
  router.get('/employer/dashboard/jobs', passport.authenticate('bearer', {session: false}), employerValidation, dashboardController.employerGetDashboardJobs);
  // router.get('/employer/dashboard/messages',  passport.authenticate('bearer', {session: false}), employerValidation, dashboardController.employerGetDashboardMessages);
  // router.get('/employer/dashboard/upcoming-interviews',  passport.authenticate('bearer', {session: false}), employerValidation, dashboardController.employerGetDashboardUpcomingInterviews);

  // for admins-------------------------------------------
  router.get('/admin/dashboard/data-counts', dashboardController.adminGetDashboardDataCounts);
  router.get('/admin/dashboard/user-engagements-counts', passport.authenticate('bearer', {session: false}), dashboardController.adminGetDashboardUserEngagementsCounts);
  router.get('/admin/dashboard/employer-engagements-counts', passport.authenticate('bearer', {session: false}), dashboardController.adminGetDashboardEmployerEngagementsCounts);
  router.get('/admin/dashboard/time-on-platform', passport.authenticate('bearer', {session: false}), dashboardController.adminGetDashboardTimeOnWebsite);
  router.get('/admin/dashboard/website-sessions', passport.authenticate('bearer', {session: false}), dashboardController.adminGetDashboardWebsiteSessions);
  router.get('/admin/dashboard/churn-counts', passport.authenticate('bearer', {session: false}), adminValidation, dashboardController.adminDashboardChurn);

  router.get('/admin/dashboard/subscription-types-counts', passport.authenticate('bearer', {session: false}), adminValidation, dashboardController.adminDashboardSubscriptionTypes);

  router.get('/admin/dashboard/jobs-by-trade-counts', passport.authenticate('bearer', {session: false}), adminValidation, dashboardController.adminDashboardJobsByTrade);

  router.get('/admin/dashboard/users-by-trade-counts', passport.authenticate('bearer', {session: false}), adminValidation, dashboardController.adminDashboardUsersByTrade);
};


