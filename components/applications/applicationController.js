const paginationHelper = require('../../helpers/paginationHelper');
const responseHelper = require('../../helpers/responseHelper');
const { Application, Job } = require('../../models');
const {
  JOB_LIST,
  APPLICATION_PHASE_CHANGED,
  SERVER_ERROR,
} = require('../../utils/constVariables');
module.exports = {
  // for all users----------------------------------------

  // for workers------------------------------------------
  // gets all the applications of the worker
  workerGetApplications: async (req, res, next) => {
    try {
      const { limit, skip } = await paginationHelper(req, 1, 5);
      const { phase, title } = req.query;

      if (title) {
        const existing_title = await Job.find({ 'title': { '$regex': req.query.title, '$options': 'i' } }, '_id');
        let where = { user_id: req.user['user_id'], job_id: existing_title };
        phase ? where['phase'] = phase : where = where;

        const applications = await Application.find(where)
          .skip(skip)
          .limit(limit)
          .sort({ created_at: -1 })
          .populate({ path: 'job', select: { title: 1, job_type: 1, company_id: 1, pay_rate: 1, 'categories.skills': 1, 'categories.title': 1 } })
          .populate({ path: 'company', select: { profile_image: 1, company_name: 1 } })
          .lean();
        await responseHelper(true, JOB_LIST, 200, '', applications, res);
      } else {
        let where = { user_id: req.user['user_id'] };
        phase ? where['phase'] = phase : where = where;

        const applications = await Application.find(where)
          .skip(skip)
          .limit(limit)
          .sort({ created_at: -1 })
          .populate({ path: 'job', select: { title: 1, job_type: 1, company_id: 1, pay_rate: 1, 'categories.skills': 1, 'categories.title': 1 } })
          .populate({ path: 'company', select: { profile_image: 1, company_name: 1 } })
          .lean();
        await responseHelper(true, JOB_LIST, 200, '', applications, res);
      }
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  // for employers----------------------------------------
  // changes the phase of the application from employer portal
  employerApplicationPhaseChange: async (req, res, next) => {
    try {
      const { application_id, phase } = req.params;
      const where = { _id: application_id };
      const application = await Application.findOne(where);
      application['phase'] = phase;
      application['read'] = true;
      await application.save();
      await responseHelper(true, APPLICATION_PHASE_CHANGED, 200, '', application, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  // for admins-------------------------------------------

};

