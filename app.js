require('dotenv').config();
const express = require('express');
const app = express();
const {router, cors, loggers, passport} = require('./middleware');
const path = require('path');
const {logRequest, logError} = loggers;

require('./middleware/dbConnection');

// passport js
app.use(passport.initialize());

// swagger implementation
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.urlencoded({limit: '50mb', extended: false}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'public'));
app.set('view engine', 'ejs');


// for accessing files in req.files
const fileUpload = require('express-fileupload');
app.use(fileUpload());

// cors imlementation
app.use(cors);

// logging request
app.use(logRequest);
app.use(logError);

// Routes setup
const apiRoutes = router();

// check token is bearer of not

if ( ['development', 'production'].includes(process.env.APP_ENV) ) {
  app.use('/api/v1', apiRoutes);
} else {
  app.use('/test', apiRoutes);
}

// no route 404 response
app.use((req, res, next) => {
  if (!req.route) {
    logger.warn(`requested resource is not avaiable yet :: ${req.url}`);
    return res.json('requested resource is not avaiable yet');
  }
});

module.exports = app;
