const pino = require('pino');
const logger = pino({
  prettyPrint: {
    colorize: true,
    translateTime: true,
    ignore: 'pid,hostname',
  },
});

// globalization of logger
global.logger = logger;

module.exports = {
  // logs request type and url endpoint
  logRequest: (req, res, next) => {
    logger.info(`TYPE:${req.method.toLowerCase()} && URL:${req.url}`);
    next();
  },

  // logs error
  logError: (err, req, res, next) => {
    logger.error(err);
    next();
  },
};
