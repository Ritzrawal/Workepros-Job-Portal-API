const nodemailer = require('nodemailer');
const responseHelper = require('./responseHelper');
const {forgotPasswordMail, adminLoginMail, companyMemberRegisterMail} = require('./nodemailerHelper');
const {SERVER_ERROR} = require('../utils/constVariables');

module.exports = {
  nodemailer: async (requirements, forWhat, res) => {
    try {
      const transporter = await nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        auth: {
          user: process.env.MAIL_ACCOUNT,
          pass: process.env.MAIL_PASSWORD,
        },
      });
      switch (forWhat) {
        case 'forgotPassword':
          return await forgotPasswordMail(requirements, transporter, res);
        case 'adminCredentials':
        return await adminLoginMail(requirements, transporter, res);
        case 'companyMemberCredentials':
        return await companyMemberRegisterMail(requirements, transporter, res);
      }
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
};
