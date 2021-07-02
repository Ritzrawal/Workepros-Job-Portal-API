const responseHelper = require('../../helpers/responseHelper');
const {awsUpload} = require('../../helpers/awsS3');
const {
  SERVER_ERROR,
  FILE_UPLOAD_SUCCESS,
} = require('../../utils/constVariables');
module.exports = {
  // for all users----------------------------------------
  uploadFile: async (req, res, next) => {
    try {
      const files = req.files['files'];
      const current_date = Date.now();
      let fileNames;
      const uploadFile = async (file) => {
        const file_path = `file_${current_date}.${file.mimetype.split('/').pop()}`;
        const awsLink = await awsUpload(file.data, file_path, file.mimetype);
        if (awsLink) {
          return awsLink.replace(process.env.AWS_URL, '');
        }
      };
      if (files.length) {
        fileNames = await Promise.all(
            files.map(async (file) => {
              const filename = await uploadFile(file);
              return filename;
            }),
        );
      } else {
        fileNames = await uploadFile(files);
      }
      return responseHelper(true, FILE_UPLOAD_SUCCESS, 200, '', fileNames, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  // for workers------------------------------------------

  // for employers----------------------------------------

  // for admins-------------------------------------------

};
