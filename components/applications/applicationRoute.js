const {workerValidation, employerValidation} = require('../../helpers/inputValidation');
const ApplicationController = require('./applicationController');


module.exports = (router, passport) => {
  // for all user------------------------------------

  // for workers-------------------------------------
  // gets all the applications of the worker
  router.get('/worker/applications', passport.authenticate('bearer', {session: false}), workerValidation, ApplicationController.workerGetApplications);

  // for employers-----------------------------------
  // changes the phase of the application
  router.get('/employer/application/:application_id/change-phase/:phase', passport.authenticate('bearer', {session: false}), employerValidation, ApplicationController.employerApplicationPhaseChange);

  // for admins---------------------------------------
};

