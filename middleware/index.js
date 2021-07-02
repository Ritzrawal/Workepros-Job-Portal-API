const cors = require('./cors');
const loggers = require('./logger');
const passport = require('./passport');
const router = require('./routerIndex');
const db = require('./dbConnection');
module.exports = {
  cors,
  passport,
  router,
  loggers,
  db,
};
