const { supportTicketValidation, supportMessageValidation, messageValidation, employerValidation, adminValidation} = require('../../helpers/inputValidation');
const MessageController = require('./messageController');
const clientAuth = require('../../middleware/clientAuth');



module.exports = (router, passport) => {
  // for all user------------------------------------
  router.post('/send-message', passport.authenticate('bearer', {session: false}), messageValidation, MessageController.sendMessage);

  //send support message
  router.post('/support/send-message', passport.authenticate('bearer', {session: false}),supportMessageValidation, MessageController.sendSupportMessage);

  // message read
  router.post('/message/read', passport.authenticate('bearer', {session: false}), MessageController.readMessage);

  // message unread
  router.post('/message/unread', passport.authenticate('bearer', {session: false}), MessageController.unreadMessage);


  // for workers-------------------------------------
  router.get('/conversations', passport.authenticate('bearer', {session: false}), MessageController.getConversations);
  router.get('/conversation/:conversation_id/messages', passport.authenticate('bearer', {session: false}), MessageController.getConversationMessages);
  router.delete('/message/deleteMessage/:message_id', passport.authenticate('bearer', {session: false}), clientAuth, MessageController.deleteMessage);


  // for employers-----------------------------------
  router.get('/employer/get-messages', passport.authenticate('bearer', {session: false}), employerValidation, MessageController.getConversations);


  // for admins---------------------------------------
  router.get('/admin/get-messages', passport.authenticate('bearer', {session: false}), adminValidation, MessageController.getConversations);

  router.delete('/admin/message/deleteMessage/:message_id', passport.authenticate('bearer', {session: false}), adminValidation, MessageController.adminDeleteMessage);
  
  router.get('/admin/conversations', passport.authenticate('bearer', {session: false}), adminValidation, MessageController.adminGetConversations);

  router.get('/admin/conversation/:conversation_id/messages', passport.authenticate('bearer', {session: false}), adminValidation, MessageController.adminGetConversationMessages);

  router.get('/admin/support/conversations', passport.authenticate('bearer', {session: false}), adminValidation, MessageController.adminSupportConversation);

  router.post('/admin/ticket/resolve',passport.authenticate('bearer', {session: false}), adminValidation, supportTicketValidation, MessageController.adminResolveTicket);

  
};

