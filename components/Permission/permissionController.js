const responseHelper = require('../../helpers/responseHelper');
const {Permission} = require('../../models');
const {

} = require('../../utils/constVariables');
// const {Types} = require('mongoose');
module.exports = {
  // for all users----------------------------------------

  // for workers------------------------------------------

  // for employers----------------------------------------
  employerGetPermissions: async (req, res, next) => {
    try {
      const {employer} = await Permission.findOne().select('employer');
      return responseHelper(true, 'permissions', 200, '', {permissions: employer}, res);
    } catch (error) {
      console.log(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  // for admins-------------------------------------------
  adminGetPermissions: async (req, res, next) => {
    try {
      const {admin} = await Permission.findOne().select('admin');
      return responseHelper(true, 'permissions', 200, '', {permissions: admin}, res);
    } catch (error) {
      console.log(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
};
