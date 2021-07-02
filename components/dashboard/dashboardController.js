const responseHelper = require('../../helpers/responseHelper');
const { Company, Notification, Job, Application, ProfileView, User, CompanyMember } = require('../../models');
const subHistorySch = require('../../models/subscriptionHistory');
const {
  SERVER_ERROR,
  JOB_LIST,
} = require('../../utils/constVariables');
const paginationHelper = require('../../helpers/paginationHelper');
const mongoose = require('mongoose');
module.exports = {
  // for all users----------------------------------------

  // for workers------------------------------------------
  workerGetDashboardDataCounts: async (req, res, next) => {
    try {
      const application_count = await Application.count({ user_id: req.user['user_id'] });
      const interview_count = await Application.count({ user_id: req.user['user_id'], phase: 'interview' });
      const profile_view_count = await ProfileView.count({ user_id: req.user['user_id'] });
      const responseData = {
        application_count,
        profile_view_count,
        interview_count,
        gigs_done: 0,
      };
      await responseHelper(true, 'Dashboard data', 200, '', responseData, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  workerGetDashboardUpcomingInterviews: async (req, res, next) => {
    try {
      const { applications } = await Company.findOne({ _id: req.user['company_id'] }).select('applications');
      const newApplications = await Company.findOne({ _id: req.user['company_id'], applications: { $elemMatch: { phase: ['new'] } } });
      const hiredApplications = await Company.findOne({ _id: req.user['company_id'], applications: { $elemMatch: { phase: ['hired'] } } });
      const responseData = {
        applicants_count: applications && applications.length != 0 ? applications.length : 0,
        new_applicants: newApplications && newApplications['applications'] && newApplications.applications.length != 0 ? newApplications.applications.length : 0,
        hired_applications: hiredApplications && hiredApplications['applications'] && hiredApplications.applications.length != 0 ? hiredApplications.applications.length : 0,
      };
      await responseHelper(true, 'Dashboard data', 200, '', responseData, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  workerGetDashboardMessages: async (req, res, next) => {
    try {
      const { applications } = await Company.findOne({ _id: req.user['company_id'] }).select('applications');
      const newApplications = await Company.findOne({ _id: req.user['company_id'], applications: { $elemMatch: { phase: ['new'] } } });
      const hiredApplications = await Company.findOne({ _id: req.user['company_id'], applications: { $elemMatch: { phase: ['hired'] } } });
      const responseData = {
        applicants_count: applications && applications.length != 0 ? applications.length : 0,
        new_applicants: newApplications && newApplications['applications'] && newApplications.applications.length != 0 ? newApplications.applications.length : 0,
        hired_applications: hiredApplications && hiredApplications['applications'] && hiredApplications.applications.length != 0 ? hiredApplications.applications.length : 0,
      };
      await responseHelper(true, 'Dashboard data', 200, '', responseData, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  // for employers----------------------------------------
  employerGetDashboardDataCounts: async (req, res, next) => {
    try {
      const newApplications = await Company.aggregate([{ $match: { _id: req.user['company_id'] } }, { $unwind: '$applications' }, { $match: { 'applications.phase': 'applied' } }]);

      const jobCount = await Job.find({ company_id: req.user.company_id }).countDocuments();

      const profilePercent = await Company.findOne({ _id: req.user['company_id'] }).select('address company_name overview license_number email phone_number year_founded company_type company_size profile_image images website categories');

      let totalScore = 13;
      let score = 0;

      if (profilePercent.address) {
        score = score + 1
      }
      if (profilePercent.company_name) {
        score = score + 1
      }
      if (profilePercent.overview) {
        score = score + 1
      }
      if (profilePercent.license_number) {
        score = score + 1
      }
      if (profilePercent.email) {
        score = score + 1
      }
      if (profilePercent.phone_number) {
        score = score + 1
      }
      if (profilePercent.year_founded) {
        score = score + 1
      }
      if (profilePercent.company_type && profilePercent.company_type[0]) {
        score = score + 1
      }
      if (profilePercent.company_size) {
        score = score + 1
      }
      if (profilePercent.profile_image) {
        score = score + 1
      }
      if (profilePercent.images && profilePercent.images[0]) {
        score = score + 1
      }
      if (profilePercent.website) {
        score = score + 1
      }
      if (profilePercent.categories && profilePercent.categories[0]) {
        score = score + 1
      }

      newPercent = score / totalScore * 100

      const responseData = {
        new_applicants: newApplications && newApplications.length != 0 ? newApplications.length : 0,
        profile_complete: newPercent,
        job_count: jobCount
      };

      await responseHelper(true, 'Dashboard data', 200, '', responseData, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  employerGetDashboardNotifications: async (req, res, next) => {
    try {
      const notifications = await Notification.find({ for: 'employer', notification_for: req.user['user_id'] }).select('message created_at').limit(3).sort({ created_at: -1 });
      await responseHelper(true, 'Dashboard data', 200, '', notifications, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  employerGetDashboardJobs: async (req, res, next) => {
    try {
      const { limit, skip } = await paginationHelper(req, 1, 3);
      const jobs = await Job.find({ company_id: req.user['company_id'] })
        .select('title')
        .skip(skip)
        .limit(limit).
        sort({ created_at: -1 }).
        lean();
      await Promise.all(
        jobs.map(async (job) => {
          job['new_applicants_count'] = await Application.count({ job_id: job['_id'], read: false });
          job['applicants_count'] = await Application.count({ job_id: job['_id'] });
          job['interviews_count'] = await Application.count({ job_id: job['_id'], phase: ['interview'] });
        }),
      );
      await responseHelper(true, JOB_LIST, 200, '', jobs, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  employerGetDashboardMessages: async (req, res, next) => {
    try {
      const { applications } = await Company.findOne({ _id: req.user['company_id'] }).select('applications');
      const newApplications = await Company.findOne({ _id: req.user['company_id'], applications: { $elemMatch: { phase: ['new'] } } });
      const hiredApplications = await Company.findOne({ _id: req.user['company_id'], applications: { $elemMatch: { phase: ['hired'] } } });
      const responseData = {
        applicants_count: applications && applications.length != 0 ? applications.length : 0,
        new_applicants: newApplications && newApplications['applications'] && newApplications.applications.length != 0 ? newApplications.applications.length : 0,
        hired_applications: hiredApplications && hiredApplications['applications'] && hiredApplications.applications.length != 0 ? hiredApplications.applications.length : 0,
      };
      await responseHelper(true, 'Dashboard data', 200, '', responseData, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  employerGetDashboardUpcomingInterviews: async (req, res, next) => {
    try {
      const interviews = await Application.find({ _id: req.user['company_id'] }).select('phase');
      const newApplications = await Company.findOne({ _id: req.user['company_id'], applications: { $elemMatch: { phase: ['new'] } } });
      const hiredApplications = await Company.findOne({ _id: req.user['company_id'], applications: { $elemMatch: { phase: ['hired'] } } });
      const responseData = {
        applicants_count: interviews && applications.length != 0 ? applications.length : 0,
        new_applicants: newApplications && newApplications['applications'] && newApplications.applications.length != 0 ? newApplications.applications.length : 0,
        hired_applications: hiredApplications && hiredApplications['applications'] && hiredApplications.applications.length != 0 ? hiredApplications.applications.length : 0,
      };
      await responseHelper(true, 'Dashboard data', 200, '', responseData, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  // for admins-------------------------------------------
  adminGetDashboardDataCounts: async (req, res, next) => {
    try {
      const { start_date, end_date } = req.query;
      let where = {};
      // console.log(require('express-useragent').parse(req.headers['user-agent']));
      start_date && end_date ? where['created_at'] = { $gte: moment(start_date).startOf('d'), $lte: moment(end_date).endOf('d') } : where = where;
      const total_active_employer = await User.count({ ...where, ...{ role: 'employer', active: true } });
      const total_active_worker = await User.count({ ...where, ...{ role: 'worker', active: true } });
      // const total_pending_employer = await User.count({ ...where, ...{ role: 'employer', active: false } });
      const totalPendingEmployers = await User.find({ ...where, ...{ role: 'employer', active: true } }).select('created_at').lean();
      const totalActiveWorkers = await User.find({ ...where, ...{ role: 'worker', active: true } }).select('created_at').lean();
      const totalActiveEmployers = await User.find({ ...where, ...{ role: 'employer', active: true } }).select('created_at').lean();
      const total_pending_employer = 12
      const find_paid = await subHistorySch.find({ status: 'paid' }, 'price');
      let subPlan = find_paid.map(searchPlan => { return searchPlan.price; });
      let MRR = 0;

      if (subPlan) {
        for (let i = 0; i < subPlan.length; i++) {
          MRR += subPlan[i];
        }
      }

      const responseData = {
        total_active_employer,
        total_active_worker,
        total_pending_employer,
        MRR,
        total_pending_employer,
        totalPendingEmployers,
        totalActiveWorkers,
        totalActiveEmployers
      };
      // console.log(require('express-useragent').parse(req.headers['user-agent']));
      return await responseHelper(true, 'Dashboard data', 200, '', responseData, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  // adminGetCurrentMRR: async (req, res, next) => {
  //   try {
  //     const totalCompanies = await subscriberSch.find({ plan_status: 'SUBSCRIBED' }, 'price subscription_plan');
  //     let subPlan_id = totalCompanies.map(searchPlan => { return searchPlan.subscription_plan; });

  //     const findPlanDuration = await subPlanSch.find({ _id: { $in: subPlan_id } }, 'duration price');
  //     let subPlan_price = findPlanDuration.map(searchPrice => { return searchPrice.price; });

  //     const findPlanCountMonth = await subPlanSch.find({ _id: { $in: subPlan_id }, duration: 'MONTHLY' }).countDocuments();
  //     const findPlanCountYear = await subPlanSch.find({ _id: { $in: subPlan_id }, duration: 'ANUALLY' }).countDocuments();
  //     const Monthly = findPlanCountMonth * subPlan_price
  //     const Anually = findPlanCountYear * subPlan_price
  //     const MRR = Monthly + Anually

  //     let data = {
  //       findPlanDuration,
  //       findPlanCountMonth,
  //       findPlanCountYear,
  //       MRR
  //     };
  //     return await responseHelper(true, 'Current MRR', 200, '', data, res);
  //   } catch (error) {
  //     logger.error(error);
  //     return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
  //   }
  // },

  adminGetDashboardUserEngagementsCounts: async (req, res, next) => {
    try {
      const { start_date, end_date } = req.query;
      let where = {};
      start_date && end_date ? where['created_at'] = { $gte: moment(start_date).startOf('d'), $lte: moment(end_date).endOf('d') } : where = where;
      // total jobs applied
      // interview scheduled
      // jobs accepted
      // posts
      // likes
      // comments
      // total ios
      // total android
      // total mobile
      // total pc
      // user signed on
      return await responseHelper(true, 'Dashboard data', 200, '', responseData, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  adminGetDashboardEmployerEngagementsCounts: async (req, res, next) => {
    try {
      const { start_date, end_date } = req.query;
      let where = {};
      start_date && end_date ? where['created_at'] = { $gte: moment(start_date).startOf('d'), $lte: moment(end_date).endOf('d') } : where = where;
      // signed on
      // total jobs posted
      // subcontractors inquired
      // canceled subscriptions
      return await responseHelper(true, 'Dashboard data', 200, '', responseData, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  adminGetDashboardTimeOnWebsite: async (req, res, next) => {
    try {
      const { start_date, end_date } = req.query;
      let where = {};
      start_date && end_date ? where['created_at'] = { $gte: moment(start_date).startOf('d'), $lte: moment(end_date).endOf('d') } : where = where;
      // tradeperson
      // employer
      return await responseHelper(true, 'Dashboard data', 200, '', responseData, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  adminGetDashboardWebsiteSessions: async (req, res, next) => {
    try {
      const { start_date, end_date } = req.query;
      let where = {};
      start_date && end_date ? where['created_at'] = { $gte: moment(start_date).startOf('d'), $lte: moment(end_date).endOf('d') } : where = where;
      // homepage
      // for employers
      // how it works
      // log in
      // sign up
      return await responseHelper(true, 'Dashboard data', 200, '', responseData, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  adminDashboardChurn: async (req, res, next) => {
    try {
      const { limit, skip } = await paginationHelper(req, 1, 5);
      const { phase } = req.query;
      let where = { user_id: req.user['user_id'] };
      phase ? where['phase'] = phase : where = where;
      const applications = await Application.find(where)
        .skip(skip)
        .limit(limit)
        .populate({ path: 'job', select: { title: 1, job_type: 1, company_id: 1, pay_rate: 1 } })
        .populate({ path: 'company', select: { profile_image: 1, company_name: 1 } })
        .lean();
      await responseHelper(true, JOB_LIST, 200, '', applications, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  adminDashboardSubscriptionTypes: async (req, res, next) => {
    try {
      const { limit, skip } = await paginationHelper(req, 1, 5);
      const { phase } = req.query;
      let where = { user_id: req.user['user_id'] };
      phase ? where['phase'] = phase : where = where;
      const applications = await Application.find(where)
        .skip(skip)
        .limit(limit)
        .populate({ path: 'job', select: { title: 1, job_type: 1, company_id: 1, pay_rate: 1 } })
        .populate({ path: 'company', select: { profile_image: 1, company_name: 1 } })
        .lean();
      await responseHelper(true, JOB_LIST, 200, '', applications, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  adminDashboardJobsByTrade: async (req, res, next) => {
    try {
      const { limit, skip } = await paginationHelper(req, 1, 5);
      const { phase } = req.query;
      let where = { user_id: req.user['user_id'] };
      phase ? where['phase'] = phase : where = where;
      const applications = await Application.find(where)
        .skip(skip)
        .limit(limit)
        .populate({ path: 'job', select: { title: 1, job_type: 1, company_id: 1, pay_rate: 1 } })
        .populate({ path: 'company', select: { profile_image: 1, company_name: 1 } })
        .lean();
      await responseHelper(true, JOB_LIST, 200, '', applications, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  adminDashboardUsersByTrade: async (req, res, next) => {
    try {
      const { limit, skip } = await paginationHelper(req, 1, 5);
      const { phase } = req.query;
      let where = { user_id: req.user['user_id'] };
      phase ? where['phase'] = phase : where = where;
      const applications = await Application.find(where)
        .skip(skip)
        .limit(limit)
        .populate({ path: 'job', select: { title: 1, job_type: 1, company_id: 1, pay_rate: 1 } })
        .populate({ path: 'company', select: { profile_image: 1, company_name: 1 } })
        .lean();
      await responseHelper(true, JOB_LIST, 200, '', applications, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
};
