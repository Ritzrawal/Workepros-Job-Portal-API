const responseHelper = require('../helpers/responseHelper');
const {UNAUTHORIZED_CLIENT} = require('../utils/constVariables');

module.exports = async (req, res, next) => {
  try {
    const clientToken = req.headers['client-auth'];
    if (clientToken && clientToken == process.env.CLIENT_TOKEN) {
      next();
    } else {
      return responseHelper(false, UNAUTHORIZED_CLIENT, 401, '', {}, res);
    }
  } catch (error) {
    logger.error(error);
    return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
  }
}
;
