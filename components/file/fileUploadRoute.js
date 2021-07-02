const {fileValidation} = require('../../helpers/inputValidation');
const FileUploadController = require('./fileUploadController');


module.exports = (router, passport) => {
  // for all user------------------------------------
  router.post(
      '/upload-file',

      passport.authenticate('bearer', {session: false}),
      fileValidation,
      FileUploadController.uploadFile,
  );

  // for workers-------------------------------------

  // for employers-----------------------------------

  // for admins---------------------------------------
};

