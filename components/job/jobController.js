const paginationHelper = require('../../helpers/paginationHelper');
const responseHelper = require('../../helpers/responseHelper');
const { Job, WorkerDetail, Application, Company, CompanyMember } = require('../../models');
const { ObjectId } = require('mongoose').Types;
const moment = require('moment');
const {
  SERVER_ERROR,
  JOB_LIST,
  JOB_ADDED,
  JOB_DETAIL,
  JOB_ALREADY_APPLIED,
  JOB_FAVOURITE,
  JOB_UNFAVOURITE,
  JOB_SAVED,
  JOB_UNSAVED,
  JOB_UPDATED,
  JOB_APPLIED,
  NEW_APPLICATION,
  JOB_NOT_FOUND,
  CANDIDATE_LISTS,
  JOB_ACTIVATED,
  JOB_DEACTIVATED,
} = require('../../utils/constVariables');
const createNotification = require('../../helpers/createNotification');
module.exports = {
  // for all users----------------------------------------
  getJobs: async (req, res, next) => {
    try {
      const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
      const { locations, category, search, pay_rate, skill_level } = filters;
      let where = {
        phase: 'published',
        active: true,
      };
      skill_level ? where['skill_level'] = skill_level : where = where;
      search ? where['title'] = { $regex: search, $options: 'i' } : where = where;
      locations && locations.length > 0 ? where['address.city'] = locations : where = where;
      pay_rate ? where['pay_rate.min'] = { $gte: pay_rate['min'] } : where = where;
      pay_rate ? where['pay_rate.max'] = { $lte: pay_rate['max'] } : where = where;
      if (category && category['title']) {
        if (category['skills'] && category['skills'].length != 0) {
          category['skills'] = { $in: category['skills'] };
        } else {
          delete category['skills'];
        }
        where['categories'] = { $elemMatch: category };
      }
      const { limit, skip } = await paginationHelper(req, 1, 7);
      const select = 'id title company_id address.city pay_rate categories.title summary responsibilities job_type categories.skills';
      const jobs = await Job.find(where).select(select).limit(limit).skip(skip).sort({ created_at: -1 }).populate({ path: 'company', select: { company_name: 1, profile_image: 1 } }).lean();
      const totalJobs = await Job.count(where);
      const responseJobs = {
        jobs,
        totalJobs,
      };
      await responseHelper(true, JOB_LIST, 200, '', responseJobs, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  getJob: async (req, res, next) => {
    try {
      const jobId = ObjectId(req.params['job_id']);
      const where = {
        active: true,
        phase: 'published',
        _id: jobId,
      };
      const select = '_id title job_type pay_rate summary responsibilities benefits company_id address.city address.state created_at working_schedule categories.desired_experience';
      const job = await Job.findOne(where).select(select).populate({ path: 'company', select: '_id company_name company_type profile_image cover_image images company_size year_founded website categories' }).lean();
      const total_company_job = await Job.count({ company_id: job['company_id'] });
      // job = job.toObject();
      job['total_company_job'] = total_company_job;

      await responseHelper(true, JOB_DETAIL, 200, '', job, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  // for workers------------------------------------------
  workerApplyJob: async (req, res, next) => {
    try {
      const jobId = ObjectId(req.params['job_id']);
      const userApplication = await Application.findOne({ user_id: req.user['user_id'], job_id: jobId }).lean();
      const user = await WorkerDetail.findOne({ user_id: req.user['user_id'] }).lean();
      const job = await Job.findOne({ _id: jobId }).select('company_id').lean();
      const company = await Company.findOne({ _id: job['company_id'] }).select('user_id').lean();
      if (userApplication) {
        return await responseHelper(false, JOB_ALREADY_APPLIED, 400, '', {}, res);
      } else {
        await Application.create({ user_id: req.user['user_id'], job_id: jobId, company_id: job['company_id'] });
        await createNotification({
          for: 'employer',
          notification_for: company['user_id'],
          notification_by: req.user['user_id'],
          job_id: jobId,
          notification_type: 'new_application',
          message: `${NEW_APPLICATION.replace('{name}', `- ${user['first_name']} ${user['last_name']}`)}`
        });
      }

      // const workerDetail = await WorkerDetail.findOne({user_id: req.user['user_id']});
      // const alreadyApplied = await WorkerDetail.findOne({user_id: req.user['user_id'], applied_jobs: {$in: [jobId]}});
      // if (alreadyApplied) {
      //   return await responseHelper(false, JOB_ALREADY_APPLIED, 400, '', {}, res);
      // }
      // const {company} = await Job.findOne({_id: jobId}).select('company_id').populate({path: 'company', select: {applications: 1}});
      // company['applications'].push({user_id: req.user['user_id'], job_id: jobId});
      // workerDetail['applied_jobs'].push(jobId);
      // await createNotification({for: 'employer', message: `${NEW_APPLICATION}`});
      // await workerDetail.save();
      // await company.save();
      await responseHelper(true, JOB_APPLIED, 200, '', {}, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  workerSaveUnsaveJob: async (req, res, next) => {
    try {
      const jobId = ObjectId(req.params['job_id']);
      const workerDetail = await WorkerDetail.findOne({ user_id: req.user['user_id'] });
      const alreadySaved = await WorkerDetail.findOne({ user_id: req.user['user_id'], saved_jobs: { $in: [jobId] } });
      if (alreadySaved) {
        workerDetail['saved_jobs'].pull(jobId);
      } else {
        workerDetail['saved_jobs'].push(jobId);
      }
      await workerDetail.save();
      await responseHelper(true, alreadySaved ? JOB_UNSAVED : JOB_SAVED, 200, '', {}, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  workerAddRemoveFavouriteJob: async (req, res, next) => {
    try {
      const jobId = ObjectId(req.params['job_id']);
      const workerDetail = await WorkerDetail.findOne({ user_id: req.user['user_id'] });
      const alreadyFav = await WorkerDetail.findOne({ user_id: req.user['user_id'], fav_jobs: { $in: [jobId] } });
      if (alreadyFav) {
        workerDetail['fav_jobs'].pull(jobId);
      } else {
        workerDetail['fav_jobs'].push(jobId);
      }
      await workerDetail.save();
      await responseHelper(true, alreadyFav ? JOB_UNFAVOURITE : JOB_FAVOURITE, 200, '', {}, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  workerGetSavedJobs: async (req, res, next) => {
    try {
      const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
      const { title } = filters;

      const { limit, skip } = await paginationHelper(req, 1, 5);
      const { saved_jobs } = await WorkerDetail.findOne({ user_id: req.user['user_id'] });
      let where = {
        _id: saved_jobs,
        active: true,
      };
      title ? where['title'] = { $regex: title, $options: 'i' } : where = where;

      const filterDate = moment().subtract(req.query['day_filter'], 'd').startOf('day');
      if (req.query && req.query['day_filter']) {
        where['created_at'] = { $gte: filterDate };
      }
      const jobs = await Job.find(where).select({ title: 1, job_type: 1, company_id: 1, pay_rate: 1, created_at: 1, 'categories.skills': 1, 'categories.title': 1 })
        .sort({ created_at: -1 })
        .limit(limit)
        .skip(skip)
        .populate({ path: 'company', select: { profile_image: 1, company_name: 1 } })
        .lean();

      const total_saved_jobs = await Job.countDocuments(where).lean();
      if (jobs && jobs.length != 0) {
        await Promise.all(
          jobs.map(async (job) => {
            const applied = await Application.findOne({ user_id: req.user['user_id'], job_id: job['_id'] }).lean();
            job['applied'] = applied ? true : false;
          }),
        );
      }
      const responseData = {
        saved_jobs: jobs,
        total_saved_jobs,
      };
      await responseHelper(true, JOB_LIST, 200, '', responseData, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  workerGetJob: async (req, res, next) => {
    try {
      const jobId = ObjectId(req.params['job_id']);
      const where = {
        active: true,
        phase: 'published',
        _id: jobId,
      };
      const select = '_id title job_type pay_rate summary responsibilities benefits company_id address.city address.state created_at working_schedule categories job_role';
      const job = await Job.findOne(where).select(select).populate({ path: 'company', select: '_id company_name company_type images profile_image cover_image company_size year_founded website categories' }).lean();
      if (job) {
        const total_company_job = await Job.count({ company_id: job['company_id'], phase: 'published' });
        const applied = await Application.findOne({ user_id: req.user['user_id'], job_id: jobId });
        const saved = await WorkerDetail.findOne({ user_id: req.user['user_id'], saved_jobs: { $in: [jobId] } });
        const fav = await WorkerDetail.findOne({ user_id: req.user['user_id'], fav_jobs: { $in: [jobId] } });
        // job = job.toObject();
        job['total_company_job'] = total_company_job;
        job['applied'] = applied ? true : false;
        job['saved'] = saved ? true : false;
        job['fav'] = fav ? true : false;

        return await responseHelper(true, JOB_DETAIL, 200, '', job, res);
      }
      return await responseHelper(false, JOB_NOT_FOUND, 404, '', {}, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  workerGetJobSuggestions: async (req, res, next) => {
    try {
      const where = { active: true, phase: 'published' };
      const select = '_id title job_type pay_rate summary responsibilities benefits company_id address.city address.state created_at working_schedule categories.desired_experience categories.skills';
      const jobs = await Job.find(where).select(select).populate({ path: 'company', select: '_id company_name profile_image' }).sort({ created_at: -1 }).lean();

      if (jobs) {
        const job_results = await Promise.all(jobs.map(async job => {
          let newJob = job
          const appliedPromise = Application.findOne({ user_id: req.user['user_id'], job_id: job._id });
          const savedPromise = WorkerDetail.findOne({ user_id: req.user['user_id'], saved_jobs: { $in: [job._id] } });
          const favouritePromise = WorkerDetail.findOne({ user_id: req.user['user_id'], fav_jobs: { $in: [job._id] } });

          const [applied, saved, favourite] = await Promise.all([appliedPromise, savedPromise, favouritePromise]);

          newJob.applied = applied ? true : false;
          newJob.saved = saved ? true : false;
          newJob.fav = favourite ? true : false;

          return newJob
        }));

        return await responseHelper(true, JOB_DETAIL, 200, '', job_results, res);
      }

    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  // for employers----------------------------------------

  // creates job as a company
  employerCreateJob: async (req, res, next) => {
    try {
      const job = new Job({
        title: req.body['title'],
        job_type: req.body['job_type'],
        job_role: req.body['job_role'],
        pay_rate: req.body['pay_rate'],
        summary: req.body['summary'],
        responsibilities: req.body['responsibilities'],
        address: req.body['address'],
        benefits: req.body['benefits'],
        working_schedule: req.body['working_schedule'],
        phase: req.body['phase'],
        active: req.body['phase'] == 'published' ? true : false,
        certificates: req.body['certificates'],
        company_id: req.user['company_id'],
        categories: req.body['categories'],
      });
      await job.save();
      await responseHelper(true, JOB_ADDED, 200, '', {}, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  employerGetJobs: async (req, res, next) => {
    try {
      const { skip, limit } = await paginationHelper(req, 1, 4);
      const { phase } = req.query;
      const where = { company_id: req.user['company_id'] };
      if (phase && phase == 'expired') {
        where['expires_at'] = { $lt: Date.now() };
      } else {
        where['phase'] = phase;
      }
      const jobs = await Job.find(where)
        .select(' phase title categories active summary address.city created_at')
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
  employerGetJob: async (req, res, next) => {
    try {
      const jobId = ObjectId(req.params['job_id']);
      const where = {
        _id: jobId,
      };
      const select = '_id title job_type summary address.city address.state';
      const job = await Job.findOne(where).select(select).lean();
      await responseHelper(true, JOB_DETAIL, 200, '', job, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  employerGetAppliedJobs: async (req, res, next) => {
    try {
      const { skip, limit } = await paginationHelper(req, 1, 4);
      const companyJobs = await Application.find({ company_id: req.user['company_id'] })
        .select('job_id')
        .lean();
      let companyJobsIds = await Promise.all(
        companyJobs.map((job) => {
          return job['job_id'].toString();
        }),
      );
      companyJobsIds = [...new Set(companyJobsIds)];

      const appliedJobs = await Job.find({ _id: companyJobsIds })
        .select('address.city pay_rate title created_at')
        .skip(skip)
        .limit(limit)
        .sort({ created_at: -1 })
        .lean();
      await Promise.all(
        appliedJobs.map(async (job) => {
          job['new_applicants_count'] = await Application.count({ job_id: job['_id'], read: false });
          job['applicants_count'] = await Application.count({ job_id: job['_id'] });
        }),
      );
      return responseHelper(true, JOB_LIST, 200, '', appliedJobs, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  employerGetJobCandidates: async (req, res, next) => {
    try {
      // const {skip, limit} = await paginationHelper(req, 1, 4);
      const { job_id } = req.params;
      let where = { job_id: ObjectId(job_id) };
      const { phase } = req.query;

      phase ? where['phase'] = phase : where = where;
      const candidates = await Application.find(where)
        // .skip(skip)
        // .limit(limit)
        .select('user_id phase created_at').populate({ path: 'worker_detail', select: { 'profile_image': 1, 'first_name': 1, 'last_name': 1, 'categories': 1, 'address.city': 1, 'created_at': 1, 'user_id': 1, 'work_experience': 1, 'work_preferences': 1 } }).sort({ created_at: -1 }).lean();

      let datas = await Promise.all(candidates.map(async profile => {
        const profile_id = profile.worker_detail.user_id;
        const like = await CompanyMember.findOne({ user_id: req.user.user_id, like_profiles: { $in: profile_id } });
        const dislike = await CompanyMember.findOne({ user_id: req.user.user_id, dislike_profiles: { $in: profile_id } });

        profile['like'] = like ? true : false;
        profile['dislike'] = dislike ? true : false;
        return profile;

      }));

      return responseHelper(true, CANDIDATE_LISTS, 200, '', datas, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  employerGetJobApplications: async (req, res, next) => {
    try {
      // const {skip, limit} = await paginationHelper(req, 1, 4);
      const { job_id } = req.params;
      const where = { job_id: ObjectId(job_id) };
      const applications = await Application.find(where)
        // .skip(skip)
        // .limit(limit)
        .select('user_id phase')
        .populate({ path: 'worker_detail', select: { profile_image: 1, first_name: 1, last_name: 1 } })
        .sort({ created_at: -1 })
        .lean();

      return responseHelper(true, CANDIDATE_LISTS, 200, '', applications, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  employerUpdateJob: async (req, res, next) => {
    try {
      const jobId = ObjectId(req.params['job_id']);
      const job = await Job.findOne({ _id: jobId });
      await job.save();
      await responseHelper(true, JOB_UPDATED, 200, '', job, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  employerActivateDeactivateJob: async (req, res, next) => {
    try {
      const jobId = ObjectId(req.params['job_id']);
      const job = await Job.findOne({ _id: jobId, company_id: req.user['company_id'] });
      if (!job) {
        return await responseHelper(false, JOB_NOT_FOUND, 200, '', job, res);
      }
      job['active'] = !job['active'];
      await job.save();
      await responseHelper(true, job['active'] ? JOB_ACTIVATED : JOB_DEACTIVATED, 200, '', job, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  // for admins-------------------------------------------


};

