const {
  signInValidation,
  signUpValidation,
  googleAuthValidation,
  googleSignInValidation,
} = require('../../helpers/inputValidation');
const AuthController = require('./authController');


module.exports = (router, passport) => {
  // sign in route
  router.post('/sign-in', signInValidation, AuthController.signIn);

  // sign up route
  router.post('/sign-up', signUpValidation, AuthController.signUp);

  // sign up route
  router.post('/check-token', AuthController.checkToken);

  // // google sing up and sign in route
  router.post('/auth/google', googleAuthValidation, AuthController.authGoogle);

  // google sign in
  // router.post('/auth/google/signIn', googleSignInValidation, AuthController.googleSignIn);

  // // google sign up
  // router.post('/auth/google/signUp', googleAuthValidation, AuthController.googleSignUp);


  // log out route
  router.get(
      '/logout',

      passport.authenticate('bearer', {session: false}),
      AuthController.logout,
  );
};
