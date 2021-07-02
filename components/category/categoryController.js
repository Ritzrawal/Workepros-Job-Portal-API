const responseHelper = require('../../helpers/responseHelper');
const {trimAndLowCase} = require('../../helpers/manipulation');
const {Category} = require('../../models');
const {
  SERVER_ERROR,
  CATEGORY_LIST,
  CATEGORY_ADDED,
  CATEGORY_SKILLS_RETRIEVED,
} = require('../../utils/constVariables');
const {Types} = require('mongoose');
module.exports = {
  // for all users----------------------------------------
  getCategories: async (req, res, next) => {
    try {
      const categories = await Category.find().lean();
      return responseHelper(true, CATEGORY_LIST, 200, '', categories, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  createCategory: async (req, res, next) => {
    try {
      const category = new Category({
        title: await trimAndLowCase(req.body['title']),
        skills: await trimAndLowCase(req.body['skills']),
      });
      await category.save();
      return responseHelper(true, CATEGORY_ADDED, 200, '', category, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  getCategorySkills: async (req, res, next) => {
    try {
      const {skills} = await Category.findOne({_id: Types.ObjectId(req.params['category_id'])}).select('skills');
      return responseHelper(true, CATEGORY_SKILLS_RETRIEVED, 200, '', skills, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  // for workers------------------------------------------

  // for employers----------------------------------------

  // for admins-------------------------------------------

};

