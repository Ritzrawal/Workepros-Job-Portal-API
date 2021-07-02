const WorkerProfileSelectiveController = require('./profileSelectiveController');
const clientAuth = require('../../middleware/clientAuth');

module.exports = (router, passport) => {
  // for all user
  router.get('/states-and-cities', clientAuth, WorkerProfileSelectiveController.getCountryStatesCities);
  router.get('/default-certs', clientAuth, WorkerProfileSelectiveController.getCertificates);
  router.get('/default-exp-roles', clientAuth, WorkerProfileSelectiveController.getWorkExperienceRoles);
  router.get('/default-pref-benefits', clientAuth, WorkerProfileSelectiveController.getWorkPrefBenefits);
  router.get('/default-pref-dev-type', clientAuth, WorkerProfileSelectiveController.getWorkPrefDevelopmentType);
  router.get('/default-pref-job-type', clientAuth, WorkerProfileSelectiveController.getWorkPrefJobType);
  router.get('/default-pref-company-size', clientAuth, WorkerProfileSelectiveController.getWorkPrefCompanySize);

  // for workers


  // for employers

  // for admins
};


