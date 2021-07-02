const {Notification} = require('../models');

module.exports = async (notificationObj) => {
  const notification = new Notification(notificationObj);
  await notification.save();
  return true;
}
;
