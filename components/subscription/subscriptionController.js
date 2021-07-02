const responseHelper = require('./../../helpers/responseHelper');
const User = require('./../../models/user');
const subPlanSch = require('./../../models/subscription-plans');
const subscriberSch = require('./../../models/subscriber');
const subHistorySch = require('./../../models/subscriptionHistory');
const cardDetailSch = require('./../../models/cardDetail');
const msg = require('./../../utils/constVariables');
const paginationHelper = require('../../helpers/paginationHelper');
const moment = require('moment');
const stripe = require('stripe')(process.env.STRIPE_SECTET_KEY);

const subController = {};

//ADMIN CONTROLLER
subController.addSubrcriptionPlan = async (req, res, next) => {
  try {
    const { duration, plan, job_limit, price, features } = req.body;
    const added_at = Date.now();

    const planSch = new subPlanSch({ added_at: added_at, added_by: req.user.user_id, duration: duration, plan: plan, job_limit: job_limit, price: price, features: features });
    const savePlan = await planSch.save();

    return responseHelper(true, 'Subscription plan added successfully', 200, '', planSch, res);

  } catch (error) {
    logger.error(error);
    return responseHelper(false, msg.SERVER_ERROR, 500, '', {}, res);
  }
};

subController.updateSubcriptionPlan = async (req, res, next) => {
  try {
    const subPlan_id = req.params.plan_id;
    const { duration, plans, job_limit, price, features } = req.body;
    const updated_at = Date.now();

    const subPlan = await subPlanSch.findByIdAndUpdate(subPlan_id, { $set: { updated_at: updated_at, updated_by: req.user.user_id, duration: duration, plans: plans, job_limit: job_limit, price: price, features: features } });

    await responseHelper(true, "Subscription Plan updated successfully", 200, '', req.body, res);
  } catch (error) {
    logger.error(error);
    return responseHelper(false, msg.SERVER_ERROR, 500, '', {}, res);
  }
};

subController.deleteSubscriptionPlan = async (req, res, next) => {
  try {
    const subPlan = await subPlanSch.findOne({ _id: req.params.plan_id });
    await subPlan.remove();

    return responseHelper(true, "Subscription plan deleted successfully", 200, '', {}, res);
  } catch (error) {
    logger.error(error);
    return responseHelper(false, msg.SERVER_ERROR, 500, '', {}, res);
  }
};

//EMPLOYER CONTROLLER
subController.getSubscriptionPlan = async (req, res, next) => {
  try {
    const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
    const { duration, plan } = filters;
    let where = {};
    duration ? where['duration'] = duration : where = where;
    plan ? where['plan'] = plan : where = where;

    const { limit, skip } = await paginationHelper(req, 1, 7);
    const subs = await subPlanSch.find(where)
      .limit(limit)
      .skip(skip)
      .select('duration plan features job_limit price')
      .sort({ added_at: -1 })

    return responseHelper(true, 'Data retrieved sucessfully', 200, '', subs, res);

  } catch (error) {
    logger.error(error);
    return responseHelper(false, msg.SERVER_ERROR, 500, '', {}, res);
  }
};

subController.getSubscriptionPlanParticular = async (req, res, next) => {
  try {
    let subPlan_id = req.params.plan_id;

    const subPlan = await subPlanSch.findOne({ _id: subPlan_id }, 'duration plan features job_limit price added_at');

    await responseHelper(true, 'Data retrieved sucessfully', 200, '', subPlan, res);

  } catch (error) {
    logger.error(error);
    return responseHelper(false, msg.SERVER_ERROR, 500, '', {}, res);
  }
};

subController.subscribeToPlan = async (req, res, next) => {
  try {
    const subPlanDetails = await subPlanSch.findOne({ _id: req.params.subscription_id });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: subPlanDetails.plan + ' PLAN',
          },
          unit_amount: subPlanDetails.price * 100,
        },
        quantity: 1
      }],

      success_url: `${process.env.FRONTEND_URL}/employer/subscription/verify/{CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/employer/subscription/verify/{CHECKOUT_SESSION_ID}`,
    });

    const subscription_plan = req.params.subscription_id;
    const plan_status = req.query.plan_status;

    const subscribePlan = new subscriberSch({
      user_id: req.user.user_id,
      added_at: Date.now(),
      subscription_plan: subscription_plan,
      plan_status: plan_status,
      payment_status: session.payment_status,
      expires_at: Date.now(),
      price: subPlanDetails.price
    });
    const saveSubscriber = await subscribePlan.save();

    const subscribeHistory = new subHistorySch({
      user_id: req.user.user_id,
      subscription_plan: subscription_plan,
      subscriber_id: subscribePlan['_id'],
      price: subPlanDetails.price,
      date: Date.now(),
      status: session.payment_status,
      expires_at: Date.now(),
      type: subPlanDetails.duration,
      sessionId: session.id,
    });
    const saveHistory = await subscribeHistory.save();
    console.log(session)

    return responseHelper(true, 'Subscribed Successfully', 200, '', { session: session.id }, res);

  } catch (error) {
    logger.error(error);
    return responseHelper(false, msg.SERVER_ERROR, 500, '', {}, res);
  }
};

subController.payToPlan = async (req, res, next) => {
  try {
    const subPlanDetails = await subPlanSch.findOne({ _id: req.params.subscription_id });
    const subscriberDetails = await subscriberSch.findOne({ subscription_plan: req.params.subscription_id, user_id: req.user.user_id })
    const subscription_plan = req.params.subscription_id;

    if (subscriberDetails) {

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: subPlanDetails.plan + ' PLAN',
            },
            unit_amount: subPlanDetails.price * 100,
          },
          quantity: 1
        }],

        success_url: `${process.env.FRONTEND_URL}/employer/subscription/verify/{CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/employer/subscription/verify/{CHECKOUT_SESSION_ID}`,
      });

      const cardDetails = new cardDetailSch({
        user_id: req.user.user_id,
        address: req.body.address,
        card_number: req.body.card_number,
        name: req.body.name,
        expires_at: req.body.expires_at,
        added_at: Date.now()
      })

      const saveCardDetail = await cardDetails.save();

      const subscribeHistory = new subHistorySch({
        user_id: req.user.user_id,
        subscription_plan: subscription_plan,
        subscriber_id: subscriberDetails['_id'],
        price: subPlanDetails.price,
        date: Date.now(),
        status: session.payment_status,
        expires_at: Date.now(),
        type: subPlanDetails.duration,
        sessionId: session.id,
        card_id: cardDetails['_id']
      });
      const saveHistory = await subscribeHistory.save();

      return responseHelper(true, 'Subscribed Successfully', 200, '', { session: session.id }, res);

    }
    return responseHelper(false, 'Not a valid subscriber', 404, '', {}, res);

  } catch (error) {
    logger.error(error);
    return responseHelper(false, msg.SERVER_ERROR, 500, '', {}, res);
  }
};

subController.stripeWebhook = async (req, res, next) => {
  try {
    console.log(req.body)
    const { payment_status, session_id } = req.body;
  } catch (error) {
    logger.error(error);
    return responseHelper(false, msg.SERVER_ERROR, 500, '', {}, res);
  }
};

subController.getCurrentPlan = async (req, res, next) => {
  try {
    const currentPlan = await subscriberSch.findOne({ user_id: req.user.user_id, plan_status: 'SUBSCRIBED' }).populate({ path: 'subscription_plan', select: 'plan features job_limit price duration' });
    const history = await subHistorySch.find({ user_id: req.user.user_id, subscription_plan: currentPlan.subscription_plan });
    const data = {
      currentPlan,
      history
    }
    return responseHelper(true, 'Subscribed Successfully', 200, '', data, res);

  } catch (error) {
    logger.error(error);
    return responseHelper(false, msg.SERVER_ERROR, 500, '', {}, res);
  }
};

subController.verifyPayment = async (req, res, next) => {
  try {
    const { session_id } = req.params;

    const [paymentHistory, session] = await Promise.all([subHistorySch.findOne({ sessionId: session_id }), stripe.checkout.sessions.retrieve(`${session_id}`)]);

    if (paymentHistory.status === 'unpaid' && session.payment_status === 'paid') {
      const subscribe_status = await subscriberSch.updateMany({ user_id: paymentHistory.user_id }, { $set: { plan_status: 'PENDING' } })

      const subscriberDetails = await subscriberSch.findOne({ _id: paymentHistory.subscriber_id });

      if (paymentHistory.type === 'ANUALLY') {
        paymentHistory['expires_at'] = moment(paymentHistory.expires_at).add(365, 'days');
        subscriberDetails['expires_at'] = moment(subscriberDetails.expires_at).add(365, 'days');


      } else if (paymentHistory.type === 'MONTHLY') {
        paymentHistory['expires_at'] = moment(paymentHistory.expires_at).add(30, 'days');
        subscriberDetails['expires_at'] = moment(subscriberDetails.expires_at).add(30, 'days');

      }
      subscriberDetails['plan_status'] = 'SUBSCRIBED';
      await subscriberDetails.save();
    }

    paymentHistory['status'] = session.payment_status;
    await paymentHistory.save();

    return responseHelper(true, 'Verified Successfully', 200, '', { payment_status: session.payment_status }, res);
  } catch (error) {
    logger.error(error);
    return responseHelper(false, msg.SERVER_ERROR, 500, '', {}, res);
  }
};

module.exports = subController;