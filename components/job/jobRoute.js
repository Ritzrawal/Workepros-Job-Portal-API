const {
  JobValidation,
  employerValidation,
  workerValidation,
} = require('../../helpers/inputValidation');
const JobController = require('./jobController');
const clientAuth = require('../../middleware/clientAuth');

module.exports = (router, passport) => {
  // for all users----------------------------------------
  router.get('/jobs', clientAuth, JobController.getJobs);
  router.get('/jobs/:job_id', clientAuth, JobController.getJob);

  // for workers------------------------------------------
  router.get('/worker/saved-jobs', passport.authenticate('bearer', {session: false}), workerValidation, JobController.workerGetSavedJobs);
  router.get('/worker/apply-job/:job_id', passport.authenticate('bearer', {session: false}), workerValidation, JobController.workerApplyJob);
  router.get('/worker/get-job/:job_id', passport.authenticate('bearer', {session: false}), workerValidation, JobController.workerGetJob);
  router.get('/worker/save-unsave-job/:job_id', passport.authenticate('bearer', {session: false}), workerValidation, JobController.workerSaveUnsaveJob);
  router.get('/worker/add-remove-favourite-job/:job_id', passport.authenticate('bearer', {session: false}), workerValidation, JobController.workerAddRemoveFavouriteJob);
  router.get('/worker/get-job-suggestions', passport.authenticate('bearer', {session: false}), workerValidation, JobController.workerGetJobSuggestions);

  // for employers----------------------------------------
  router.post('/employer/create-job', passport.authenticate('bearer', {session: false}),
      employerValidation,
      JobValidation,
      JobController.employerCreateJob,
  );
  router.get('/employer/get-jobs', passport.authenticate('bearer', {session: false}),
      employerValidation,
      JobController.employerGetJobs,
  );
  router.get('/employer/jobs/:job_id', passport.authenticate('bearer', {session: false}),
      employerValidation,
      JobController.employerGetJob,
  );
  router.get('/employer/get-applied-jobs', passport.authenticate('bearer', {session: false}),
      employerValidation,
      JobController.employerGetAppliedJobs,
  );
  router.get('/employer/job/:job_id/candidates', passport.authenticate('bearer', {session: false}),
      employerValidation,
      JobController.employerGetJobCandidates,
  );
  router.get('/employer/job/:job_id/applications', passport.authenticate('bearer', {session: false}),
      employerValidation,
      JobController.employerGetJobApplications,
  );

  router.get('/employer/activate-deactivate-job/:job_id', passport.authenticate('bearer', {session: false}),
      employerValidation,
      JobController.employerActivateDeactivateJob,
  );

  router.put('/employer/update-job/:job_id', passport.authenticate('bearer', {session: false}),
      employerValidation,
      JobController.employerUpdateJob,
  );


  // for admins-------------------------------------------
};

