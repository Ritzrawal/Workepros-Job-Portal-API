const {
  SERVER_ERROR,
} = require('../utils/constVariables');
const responseHelper = require('./responseHelper');
module.exports = {
  // User-defined function to compare the input data with joiobject
  validateData: async (data, JoiSchema, errors, res, next) => {
    try {
      const response = await JoiSchema.validate(data);
      if (response.error) {
        await Promise.all(
            response.error.details.map(async (errDetail)=> {
              errors[errDetail.context.label] = errDetail.message;
            }),
        );
      }
      const errorKeys = Object.keys(errors);
      if (errorKeys.length != 0) {
        errors['error'] = errors[Object.keys(errors)[0]];
        return responseHelper(false, errors, 400, 'validation', {}, res);
      } else {
        logger.info('BODY_VALIDATED');
        next();
      }
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
};
