const ejs = require('ejs');
module.exports = {
  forgotPasswordMail: async (requirements, transporter, res) => {
    try {
      const data = await ejs.renderFile('./public/ejs/forgot-password.ejs', {
        name: requirements.user.first_name,
        email: requirements.user.email,
        link: `${process.env.APP_URL}/change-password?Authorization=${requirements.token}`,
      });
      if (data) {
        const mainOptions = {
          from: `Job Portal<${process.env.MAIL_HOST}>`,
          to: requirements.user.email,
          subject: 'Reset Password',
          html: data,
        };
        await transporter.sendMail(mainOptions);
        logger.info('Forgot password mail sent');
        return true;
      } else {
        logger.error('ejsFunction error');
        return false;
      }
    } catch (error) {
      logger.error(error);
      return false;
    }
  },

  adminLoginMail: async (requirements, transporter, res) => {
    try {
      const data = await ejs.renderFile('./public/ejs/admin-register.ejs', {
        name: requirements.user.first_name,
        email: requirements.user.email,
        link: `Your email is ${requirements.user.email} and your password is ${requirements.password}.`,
      });
      if (data) {
        const mainOptions = {
          from: `Job Portal<${process.env.MAIL_HOST}>`,
          to: requirements.user.email,
          subject: 'Admin Credentials',
          html: data,
        };
        await transporter.sendMail(mainOptions);
        logger.info('Admin email and password mail sent');
        return true;
      } else {
        logger.error('ejsFunction error');
        return false;
      }
    } catch (error) {
      logger.error(error);
      return false;
    }
  },

  companyMemberRegisterMail: async (requirements, transporter, res) => {
    try {
      const data = await ejs.renderFile('./public/ejs/company-member.ejs', {
        name: requirements.newUser.first_name,
        email: requirements.newUser.email,
        link: `Your email is ${requirements.newUser.email} and your password is ${requirements.password}.`,
      });
      if (data) {
        const mainOptions = {
          from: `Job Portal<${process.env.MAIL_HOST}>`,
          to: requirements.newUser.email,
          subject: 'Company-member Credentials',
          html: data,
        };
        await transporter.sendMail(mainOptions);
        logger.info('Company-member email and password mail sent');
        return true;
      } else {
        logger.error('ejsFunction error');
        return false;
      }
    } catch (error) {
      logger.error(error);
      return false;
    }
  },
};
