const {Router} = require('express');
const passport = require('passport');
const authRoute = require('../components/auth/authRoute');
const userRoute = require('../components/user/userRoute');
const categoryRoute = require('../components/category/categoryRoute');
const jobRoute = require('../components/job/jobRoute');
const companyRoute = require('../components/company/companyRoute');
const profileSelective = require('../components/profilesSelective/profileSelectiveRoute');
const dashboardRoute = require('../components/dashboard/dashboardRoute');
const applicationRoute = require('../components/applications/applicationRoute');
const fileRoute = require('../components/file/fileUploadRoute');
const postRoute = require('../components/post/postRoute');
const messageRoute = require('../components/messages/messageRoute');
const permissionRoute = require('../components/Permission/permissionRoute');
const nonBearerTokenCheck = require('../middleware/nonBearerTokenCheck');
const adminRoute = require('./../components/admin/adminRoute');
const subscriptionRoute = require('./../components/subscription/subscriptionRoute');

module.exports = () => {
  const router = Router();
  // auth routes added to app router
  // remaining work for code optimization pass nonBearer token instead of passport and use passport inside the function
  router.use(nonBearerTokenCheck);
  authRoute(router, passport);
  userRoute(router, passport);
  categoryRoute(router, passport);
  jobRoute(router, passport);
  companyRoute(router, passport);
  profileSelective(router, passport);
  dashboardRoute(router, passport);
  applicationRoute(router, passport);
  fileRoute(router, passport);
  postRoute(router, passport);
  messageRoute(router, passport);
  permissionRoute(router, passport);
  adminRoute(router, passport);
  subscriptionRoute(router, passport);
  return router;
};
