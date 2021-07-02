const paginationHelper = require('../../helpers/paginationHelper');
const responseHelper = require('../../helpers/responseHelper');
const { Company, Job, WorkerDetail } = require('../../models');
const {
  SERVER_ERROR,
  COMPANY_LIST,
  COMPANY_UPDATED,
  COMPANY_DETAIL,
  COMPANY_JOBS_LIST,
  COMPANY_UNFOLLOWED,
  COMPANY_FOLLOWED,
  COMPANY_SAVED,
  COMPANY_UNSAVED,
  COMPANY_DEACTIVATED,
  COMPANY_ACTIVATED,
} = require('../../utils/constVariables');
module.exports = {
  // for all users----------------------------------------
  getCompanies: async (req, res, next) => {
    try {
      const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
      const { categories, company_type, company_size, location } = filters;
      let where = {
        active: true,
      };
      let companyFields;
      const { limit, skip } = req.query['get_type'] && req.query['get_type'] == 'top' ? await paginationHelper(req, 1, 3) : await paginationHelper(req, 1, 10);


      if (req.query['get_type'] && req.query['get_type'] == 'top') {
        companyFields = {
          '_id': 1,
          'company_name': 1,
          'company_type': 1,
          'address.city': 1,
          'profile_image': 1,
          'cover_image': 1,
          'total_jobs': { $size: '$jobs' },
          'created_at': 1,
          'images': 1,
        };
      } else {
        companyFields = {
          '_id': 1,
          'company_name': 1,
          'categories.title': 1,
          'address.city': 1,
          'profile_image': 1,
          'cover_image': 1,
          'year_founded': 1,
          'local_employee': 1,
          'overview': 1,
          'total_jobs': { $size: '$jobs' },
          'created_at': 1,
          'images': 1,

        };
        // company_type ? where['company_type'] = company_type : where = where;
        location ? where['address.city'] = location : where = where;
        categories && categories.length != 0 ? where['categories.title'] = { $in: categories } : where = where;
        company_size ? where['company_size'] = company_size : where = where;
      }
      console.log(where);
      const total_companies = await Company.countDocuments({ active: true });
      const companies = await Company.aggregate([
        {
          $match: where,
        },
        {
          $sort: { created_at: -1 },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
        {
          $lookup: {
            from: 'jobs',
            let: { company_id: '$_id' },
            as: 'jobs',
            pipeline: [
              { $match: { $expr: { $eq: ['$company_id', '$$company_id'] } } },
            ],
          },
        },
        {
          $project: companyFields,
        },
      ]);
      const responseData = {
        companies,
        total_companies,
      };
      await responseHelper(true, COMPANY_LIST, 200, '', responseData, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  getWorkerCompanies: async (req, res, next) => {
    try {
      const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
      const { categories, company_type, company_size, location } = filters;
      let where = {
        active: true,
      };
      let companyFields;
      const { limit, skip } = req.query['get_type'] && req.query['get_type'] == 'top' ? await paginationHelper(req, 1, 3) : await paginationHelper(req, 1, 10);

      if (req.query['get_type'] && req.query['get_type'] == 'top') {
        companyFields = {
          '_id': 1,
          'company_name': 1,
          'company_type': 1,
          'address.city': 1,
          'profile_image': 1,
          'cover_image': 1,
          'total_jobs': { $size: '$jobs' },
          'created_at': 1,
          'images': 1,
        };
      } else {
        companyFields = {
          '_id': 1,
          'company_name': 1,
          'categories.title': 1,
          'address.city': 1,
          'profile_image': 1,
          'cover_image': 1,
          'year_founded': 1,
          'local_employee': 1,
          'overview': 1,
          'total_jobs': { $size: '$jobs' },
          'created_at': 1,
          'images': 1,
        };
        // company_type ? where['company_type'] = company_type : where = where;
        location ? where['address.city'] = location : where = where;
        categories && categories.length != 0 ? where['categories.title'] = { $in: categories } : where = where;
        company_size ? where['company_size'] = company_size : where = where;
      }
      console.log(where);
      const total_companies = await Company.countDocuments({ active: true });
      const companies = await Company.aggregate([
        { $match: where, },
        { $sort: { created_at: -1 }, },
        { $skip: skip, },
        { $limit: limit, },
        {
          $lookup: {
            from: 'jobs',
            let: { company_id: '$_id' },
            as: 'jobs',
            pipeline: [
              { $match: { $expr: { $eq: ['$company_id', '$$company_id'] } } },
            ],
          },
        },
        { $project: companyFields, },
      ]);

      const { saved_companies } = await WorkerDetail.findOne({ user_id: req.user.user_id }, 'saved_companies');

      let datas = await Promise.all(companies.map(async company => {
        company['save'] = saved_companies.includes(company._id)
        return company;
      }));

      const responseData = {
        companies,
        total_companies,
      };

      await responseHelper(true, COMPANY_LIST, 200, '', responseData, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  getCompany: async (req, res, next) => {
    try {
      let select = '_id company_name company_type profile_image cover_image company_size year_founded website categories';
      let company = await Company.findOne({ _id: req.params['company_id'], active: true }).select(select).sort({ local_employee: -1, global_employee: -1, year_founded: 1 });
      select = '_id title job_type pay_rate summary responsibilities benefits certificates year_founded created_at';
      const latestJob = await Job.findOne({ company_id: req.params['company_id'], active: true }).select(select).sort({ created_at: -1 });
      const totalCompanyJob = await Job.count({ company_id: req.params['company_id'], active: true });
      company = company.toObject();
      company['latest_job'] = latestJob;
      company['total_jobs'] = totalCompanyJob;
      await responseHelper(true, COMPANY_DETAIL, 200, '', company, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  getCompanyJobs: async (req, res, next) => {
    try {
      const category = req.query['category'];
      let where = {
        'company_id': req.params['company_id'],
        'active': true,
        'phase': 'published',
      };
      category ? where['categories.title'] = category : where = where;
      const { limit, skip } = await paginationHelper(req, 1, 3);
      const select = '_id title categories';
      const jobs = await Job.find(where).select(select).limit(limit).skip(skip).sort({ created_at: -1 });

      await responseHelper(true, COMPANY_JOBS_LIST, 200, '', jobs, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  // for workers------------------------------------------
  workerSearchCompany: async (req, res, next) => {
    try {
      const where = {
        'company_name': { $regex: req.params['query'], $options: 'i' },
        'active': true,
      };
      const select = '_id company_name profile_image';
      const companies = await Company.find(where).select(select).sort({ created_at: -1 });

      await responseHelper(true, COMPANY_LIST, 200, '', companies, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  workerGetCompanySuggestions: async (req, res, next) => {
    try {
      const select = '_id company_name profile_image overview';
      const companies = await Company.find({ active: true }).select(select).sort({ created_at: -1 });
      await responseHelper(true, COMPANY_LIST, 200, '', companies, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  workerCompanyStatusUpdate: async (req, res, next) => {
    try {
      const companyId = ObjectId(req.params['job_id']);
      const status = req.params['status'];
      const where = { user_id: req.user['user_id'] };
      status == 'follow' ? where['followed_companies'] = { $in: [companyId] } : where['saved_companies'] = { $in: [companyId] };
      const workerDetail = await WorkerDetail.findOne({ user_id: req.user['user_id'] });
      const alreadySaved = await WorkerDetail.findOne(where);
      if (status == 'follow') {
        if (alreadySaved) {
          workerDetail['followed_companies'].pull(companyId);
        } else {
          workerDetail['followed_companies'].push(companyId);
        }
        await workerDetail.save();
        return await responseHelper(true, alreadySaved ? COMPANY_UNFOLLOWED : COMPANY_FOLLOWED, 200, '', {}, res);
      } else {
        if (alreadySaved) {
          workerDetail['saved_companies'].pull(companyId);
        } else {
          workerDetail['saved_companies'].push(companyId);
        }
        await workerDetail.save();
        return await responseHelper(true, alreadySaved ? COMPANY_UNSAVED : COMPANY_SAVED, 200, '', {}, res);
      }
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  workerGetFollowedSavedCompanies: async (req, res, next) => {
    try {
      const { skip, limit } = await paginationHelper(req, 1, 5);
      const whereProjection = {};
      req.params['status'] == 'follow' ? whereProjection['followed_companies'] = { $slice: [skip, limit] } : whereProjection['saved_companies'] = { $slice: [skip, limit] };
      const data = await WorkerDetail.findOne({ user_id: req.user['user_id'] });
      const companies = req.params['status'] == 'follow' ? data['followed_companies'] : data['saved_companies'];
      await responseHelper(true, COMPANY_LIST, 200, '', companies, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  workerSaveUnsaveCompany: async (req, res, next) => {
    try {
      const data = {};
      const company_id = req.params['company_id'];
      const workerDetail = await WorkerDetail.findOne({ user_id: req.user['user_id'] });
      const alreadySaved = await WorkerDetail.findOne({ user_id: req.user['user_id'], saved_companies: { $in: [company_id] } });
      if (alreadySaved) {
        workerDetail['saved_companies'].pull(company_id);
      } else {
        workerDetail['saved_companies'].push(company_id);
      }
      await workerDetail.save();
      data['saved'] = alreadySaved ? false : true;

      await responseHelper(true, alreadySaved ? COMPANY_UNSAVED : COMPANY_SAVED, 200, '', data, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  // for employers----------------------------------------

  employerUpdateCompany: async (req, res, next) => {
    try {
      await Company.update({ _id: req.user['company_id'] }, req.body);
      await responseHelper(true, COMPANY_UPDATED, 200, '', {}, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  // for admins-------------------------------------------
  adminGetCompanies: async (req, res, next) => {
    try {
      const { limit, skip } = await paginationHelper(req, 1, 3);
      const companies = await Company.find().lean().limit(limit).skip(skip);
      await responseHelper(true, COMPANY_LIST, 200, '', companies, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  adminActivateDeactivateCompany: async (req, res, next) => {
    try {
      const company = await Company.findOne({ _id: req.params['company_id'] });
      company['active'] = !company['active'];
      await company.save();
      await responseHelper(true, company['active'] ? COMPANY_DEACTIVATED : COMPANY_ACTIVATED, 200, '', {}, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
};
