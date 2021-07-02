'use strict';
// Import the mongoose module
const mongoose = require('mongoose');

// Set up default mongoose connection
const mongoDB = process.env.APP_ENV == 'test' ? process.env.MONGO_DB_URL_TEST: process.env.MONGO_DB_URL;
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false});

// Get the default connection
const db = mongoose.connection;

// Bind connection to error event (to get notification of connection errors)
db.once('connected', async () => {
  logger.info('connection to database successful');
});
db.on('error', async (err) => {
  logger.error('Error in mongodb connection: ', err);
  db.disconnect();
});

module.exports = {db, mongoose}
;
