const responseHelper = require('../helpers/responseHelper');

module.exports = async (req, res, next)=> {
  try {
    if (req.headers.authorization) {
      if (req.headers.authorization.startsWith('bearer ') || req.headers.authorization.startsWith('Bearer ')) {
        return next();
      } else {
        return responseHelper(false, 'Token must be bearer token', 400, '', {}, res);
      }
    }
    return next();
  } catch (error) {
    logger.error(error);
  }
};
