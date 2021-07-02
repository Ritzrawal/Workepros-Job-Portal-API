const inputValidation = require('./../../helpers/inputValidation');
const subController = require('./subscriptionController');
const clientAuth = require('../../middleware/clientAuth');


module.exports = (router, passport) => {

  //ADMIN ROUTES
  //add subscription plan
  router.post('/admin/subsription/addPlan', passport.authenticate('bearer', { session: false }), inputValidation.adminValidation, inputValidation.SubscriptionPlanValidation, subController.addSubrcriptionPlan);

  //update subscription plan
  router.put('/admin/subscription/updatePlan/:plan_id', passport.authenticate('bearer', { session: false }), inputValidation.adminValidation, inputValidation.SubscriptionPlanValidation, subController.updateSubcriptionPlan);

  //delete subscription plan
  router.delete('/admin/subscription/deletePlan/:plan_id', passport.authenticate('bearer', { session: false }), inputValidation.adminValidation, subController.deleteSubscriptionPlan);




  //EMPLOYER ROUTES
  //get subscription plan all
  router.get('/employer/subscription/getPlan', clientAuth, subController.getSubscriptionPlan);

  //get subscription plan particular
  router.get('/employer/subscription/getPlan/:plan_id', clientAuth, subController.getSubscriptionPlanParticular);

  //subscribe to a plan
  router.post('/employer/subscription/getSubscribed/:subscription_id', passport.authenticate('bearer', { session: false }), inputValidation.subscribeValidation, inputValidation.employerValidation, subController.subscribeToPlan);

  //pay for the subscription plan
  router.post('/employer/subscription/paySubscription/:subscription_id', passport.authenticate('bearer', { session: false }), inputValidation.employerValidation, subController.payToPlan);

  //get current plan
  router.get('/employer/subscription/currentPlan', passport.authenticate('bearer', { session: false }), inputValidation.employerValidation, subController.getCurrentPlan);

  // validate subscription plan payment
  router.get('/employer/subscription/verifyPayment/:session_id', passport.authenticate('bearer', { session: false }), inputValidation.employerValidation, subController.verifyPayment);
};
