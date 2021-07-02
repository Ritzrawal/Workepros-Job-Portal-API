const responseHelper = require('../../helpers/responseHelper');
const {WorkerSelective, CountryStateCity} = require('../../models');
const {
  SERVER_ERROR,
} = require('../../utils/constVariables');
module.exports = {
  getCountryStatesCities: async (req, res, next) => {
    try {
      const countryStatesCities = await CountryStateCity.findOne({'country_states_cities.country_name': 'united states'});
      await responseHelper(true, 'country state and cities list', 200, '', countryStatesCities, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  getCertificates: async (req, res, next) => {
    try {
      const defaultCertificates = await WorkerSelective.findOne().select('default_certificates');
      await responseHelper(true, 'Default certificates', 200, '', defaultCertificates, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  getWorkExperienceRoles: async (req, res, next) => {
    try {
      const defaultWorkExpRoles = await WorkerSelective.findOne().select('default_work_exp_roles');
      await responseHelper(true, 'default experience roles', 200, '', defaultWorkExpRoles, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  getWorkPrefBenefits: async (req, res, next) => {
    try {
      const defaultBenefits = await WorkerSelective.findOne().select('default_work_perf_benefits');
      await responseHelper(true, 'default benefits', 200, '', defaultBenefits, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  getWorkPrefDevelopmentType: async (req, res, next) => {
    try {
      const defaultDevelopmentType = await WorkerSelective.findOne().select('default_work_perf_dev_type');
      await responseHelper(true, 'default development type', 200, '', defaultDevelopmentType, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  getWorkPrefCompanySize: async (req, res, next) => {
    try {
      const defaultCompanySize = await WorkerSelective.findOne().select('default_company_size');
      await responseHelper(true, 'default company size', 200, '', defaultCompanySize, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  getWorkPrefJobType: async (req, res, next) => {
    try {
      const defaultJobType = await WorkerSelective.findOne().select('default_job_type');
      await responseHelper(true, 'default job type', 200, '', defaultJobType, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
};
