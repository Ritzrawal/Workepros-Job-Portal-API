const {categoryValidation} = require('../../helpers/inputValidation');
const CategoryController = require('./categoryController');
const clientAuth = require('../../middleware/clientAuth');

module.exports = (router, passport) => {
  // for all user------------------------------------
  // get default categories
  router.get(
      '/categories',
      clientAuth,
      CategoryController.getCategories,
  );
  router.post(
      '/create-category',
      clientAuth,
      categoryValidation,
      CategoryController.createCategory,
  );
  // get skills of a category
  router.get(
      '/category/:category_id/skills',
      clientAuth,
      CategoryController.getCategorySkills,
  );

  // for workers-------------------------------------

  // for employers-----------------------------------

  // for admins---------------------------------------
};

