const passport = require('passport');
const {User, AccessToken, Company, CompanyMember, AdminDetail} = require('../models');
const BearerStrategy = require('passport-http-bearer').Strategy;

passport.use(
    new BearerStrategy(async (token, done) => {
      const accessToken = await AccessToken.findOne({
        access_token_id: token,
      });

      if (!accessToken) {
        return done(null, false);
      }
      const user = await User.findById(accessToken['user_id']).lean().select({'role': 1});
      accessToken['role'] = user['role'];
      if (user['role'] === 'employer') {
        const userCompany = await Company.findOne({user_id: accessToken['user_id']}).select({'_id': 1}).lean();
        if (userCompany) {
          accessToken['company_id'] = userCompany['_id'];
        }
      } else if (user['role'] === 'employer-member') {
        const {company_id, permissions} = await CompanyMember.findOne({user_id: accessToken['user_id']}).select({'company_id': 1, 'permissions': 1}).lean();
        accessToken['company_id'] = company_id;
        accessToken['permissions'] = await permissionExtractor(permissions);
      } else if (user['role'] === 'admin') {
        const {permissions} = await AdminDetail.findOne({user_id: accessToken['user_id']}).select({'permissions': 1}).lean();
        accessToken['permissions'] = await permissionExtractor(permissions);
      }
      return done(null, accessToken, {scope: 'read'});
    }),
);

const permissionExtractor = async (permissions)=>{
  const permissionGiven = [];
  await Promise.all(
      Object.entries(permissions).map((permission) => {
        if (permission[1] == true) {
          permissionGiven.push(permission[0]);
        }
      }),
  );
  return permissionGiven;
};

module.exports = passport;
