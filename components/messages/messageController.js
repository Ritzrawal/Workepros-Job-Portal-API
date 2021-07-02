const responseHelper = require('../../helpers/responseHelper');
const { User, Conversation, Message, WorkerDetail, CompanyMember, AdminDetail } = require('../../models');
const moment = require('moment');
const {
  MESSAGE_SENT,
  MESSAGES_LIST,
  CONVERSATION_NOT_EXIST,
  SERVER_ERROR,
  MESSAGE_READ,
  MESSAGE_UNREAD,
} = require('../../utils/constVariables');
const { ObjectId } = require('mongoose').Types;
const httpStatus = require('http-status');
const paginationHelper = require('../../helpers/paginationHelper');



module.exports = {
  // for all users----------------------------------------
  sendMessage: async (req, res, next) => {
    try {
      const { message, receiver_id } = req['body'];
      const job_id = req.body['job_id'] || null;
      const sender_id = req.user['user_id'];
      const { conversation_type, sender_detail } = await getConversationType(sender_id, receiver_id);
      const where = {
        members: { '$size': 2, '$all': [receiver_id, sender_id] },
      };
      const conversations = await Conversation.find(where);
      const created_at = moment(req.headers['request-date']);
      const newMessage = await Message.create({ sender_id, message, created_at });
      if (conversations && conversations.length != 0) {
        let currentConversation = null;
        await Promise.all(
          conversations.map(async (conversation) => {
            if (conversation.job_id == job_id) {
              currentConversation = conversation;
            }
          }),
        );
        if (currentConversation) {
          currentConversation['messages'].push(newMessage['_id']);
          await currentConversation.save();
          io.emit(currentConversation['_id'], {
            conversation_id: currentConversation['_id'],
            message: newMessage['message'],
            name: `${sender_detail.first_name} ${sender_detail.last_name}`,
            profile_image: `${sender_detail.profile_image}`,
            created_at,
          });
        } else {
          const members = [sender_id, receiver_id];
          const messages = [newMessage['_id']];
          conversation = await Conversation.create({ members, messages, job_id, conversation_type });
          io.emit(`${receiver_id}-new-message`, {
            conversation_id: conversation['_id'],
            receiver_id: sender_id,
            message: newMessage['message'],
            name: `${sender_detail.first_name} ${sender_detail.last_name}`,
            profile_image: `${sender_detail.profile_image}`,
            created_at,
          });
        }
      } else {
        const members = [sender_id, receiver_id];
        const messages = [newMessage['_id']];
        conversation = await Conversation.create({ members, messages, job_id, conversation_type });
        io.emit(`${receiver_id}-new-message`, {
          conversation_id: conversation['_id'],
          receiver_id: sender_id,
          message: newMessage['message'],
          name: `${sender_detail.first_name} ${sender_detail.last_name}`,
          profile_image: `${sender_detail.profile_image}`,
          created_at,
        });
      }

      return responseHelper(true, MESSAGE_SENT, 200, '', {}, res);
    } catch (error) {
      console.log(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  // send support messages/ ticket
  sendSupportMessage: async (req, res, next) => {
    try {
      const { message, conversation_id } = req['body'];
      let currentConversation = null;
      const receiver = await User.find({ $or: [{ role: 'admin' }, { role: 'super-admin' }] }, '_id');

      const permission = await AdminDetail.find({ user_id: { $in: receiver }, 'permissions.read_support_messages': true })
        .select('user_id')
      const receiver_id = permission.map(check => { return check.user_id; });
      const sender_id = req.user['user_id'];
      const { conversation_type, sender_detail } = await getConversationType(sender_id, receiver_id);
      if (conversation_id) {
        currentConversation = await Conversation.findOne({ _id: conversation_id });
      }
      const created_at = moment(req.headers['request-date']);
      const newMessage = await Message.create({ sender_id, message, created_at, ticket: 'open' });

      if (currentConversation) {
        currentConversation['messages'].push(newMessage['_id']);
        await currentConversation.save();
        io.emit(currentConversation['_id'], {
          conversation_id: currentConversation['_id'],
          message: newMessage['message'],
          name: `${sender_detail.first_name} ${sender_detail.last_name}`,
          profile_image: `${sender_detail.profile_image}`,
          created_at,
        });
      } else {
        const members = [sender_id, ...receiver_id];
        const messages = [newMessage['_id']];
        conversation = await Conversation.create({ members, messages, conversation_type });
        io.emit(`${receiver_id}-new-message`, {
          conversation_id: conversation['_id'],
          receiver_id: sender_id,
          message: newMessage['message'],
          name: `${sender_detail.first_name} ${sender_detail.last_name}`,
          profile_image: `${sender_detail.profile_image}`,
          created_at,
        });
      }

      return responseHelper(true, MESSAGE_SENT, 200, '', {}, res);
    } catch (error) {
      console.log(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  // for workers------------------------------------------

  getConversations: async (req, res, next) => {
    try {
      const { limit, skip } = await paginationHelper(req, 1, 7);
      let filter = { $and: [{ members: { $in: [req.user['user_id']] } }, { $or: [{ conversation_type: 'b-w' }, { conversation_type: 'b-b' }, { conversation_type: 'w-w' }] }] };

      if (req.query.name) {
        const searchUser = await WorkerDetail.find({
          $or: [{ 'first_name': { '$regex': req.query.name, '$options': 'i' } }, { 'last_name': { '$regex': req.query.name, '$options': 'i' } }], user_id: { $ne: req.user.user_id }
        })

        const searchEmp = await CompanyMember.find({
          $or: [{ 'first_name': { '$regex': req.query.name, '$options': 'i' } }, { 'last_name': { '$regex': req.query.name, '$options': 'i' } }], user_id: { $ne: req.user.user_id }
        })

        let coordinate_user = searchUser.map(searchCandidte => { return searchCandidte.user_id; });
        let coordinate_emp = searchEmp.map(searchCandidte => { return searchCandidte.user_id; });
        const data = [...coordinate_emp, ...coordinate_user]

        filter = { $and: [{ members: { $in: data } }, { members: { $in: [req.user['user_id']] } }, { $or: [{ conversation_type: 'b-w' }, { conversation_type: 'b-b' }, { conversation_type: 'w-w' }] }] }
      }

      const messages = await Conversation.find(filter)
        .select('members created_at messages job_id')
        .populate({ path: 'message_list', options: { sort: { created_at: -1 }, } })
        // .populate({
        //   path: 'users',
        //   match: {user_id: {$ne: req.user['user_id']}},
        //   select: {'first_name': 1, 'last_name': 1, 'profile_image': 1},
        // })
        .populate({ path: 'job', populate: { path: 'company', select: { profile_image: 1, company_name: 1 } }, })
        .skip(skip)
        .limit(limit)
        .sort({ updated_at: -1 });
      const resData = await Promise.all(
        messages.map(async (message) => {
          const data = {};

          await Promise.all(
            message.members.map(async (member) => {
              const user = await User.findOne({ _id: member }).select('role').lean();
              if (member.toString() != req.user['user_id'].toString()) {
                if (user['role'] == 'worker') {
                  const { first_name, last_name, profile_image } = await WorkerDetail.findOne({ user_id: member })
                    .select('first_name last_name profile_image');
                  data['name'] = `${first_name} ${last_name}`;
                  data['profile_image'] = profile_image;
                }
                if (user['role'] == 'employer') {
                  const { first_name, last_name, profile_image } = await CompanyMember.findOne({ user_id: member })
                    .select('first_name last_name');
                  data['name'] = `${first_name} ${last_name}`;
                  data['profile_image'] = profile_image;
                }
                data['receiver_id'] = member;
              }
            }),
          );
          const message_id = message.message_list.map(msg => { return msg._id; });
          const unread = await Message.countDocuments({ _id: { $in: message_id }, read: false });

          data['message'] = message.message_list[0];
          data['conversation_id'] = message['_id'];
          data['job_id'] = message['job_id'];
          data['job'] = message['job'];
          data['created_at'] = message.created_at;
          data['total_unread'] = unread;

          return data;
        }),
      );
      return responseHelper(true, MESSAGES_LIST, 200, '', resData, res);
    } catch (error) {
      console.log(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  getConversationMessages: async (req, res, next) => {
    try {
      const { limit, skip } = await paginationHelper(req, 1, 7);
      if (await Conversation.findOne({ _id: ObjectId(req.params['conversation_id']) })) {
        const { message_list } = await Conversation.findOne({ _id: ObjectId(req.params['conversation_id']) })
          .select('messages')
          .populate({
            path: 'message_list', options: { sort: { 'created_at': -1 }, limit, skip }, populate: {
              path: 'sender',
              select: { '_id': 1, 'role': 1 },
            },
          });
        const resData = await Promise.all(
          message_list.map(async (message) => {
            const data = {};
            if (message.sender['role'] == 'worker') {
              const { first_name, last_name, profile_image } = await WorkerDetail.findOne({ user_id: message['sender_id'] })
                .select('first_name last_name profile_image');
              data['name'] = `${first_name} ${last_name}`;
              data['profile_image'] = profile_image;
            } else {
              const { first_name, last_name, profile_image } = await CompanyMember.findOne({ user_id: message['sender_id'] })
                .select('first_name last_name');
              data['name'] = `${first_name} ${last_name}`;
              data['profile_image'] = profile_image;
            }
            data['message'] = message['message'];
            data['read'] = message['read'];
            data['sender_id'] = message['sender_id'];
            data['conversation_id'] = req.params['conversation_id'];
            data['created_at'] = message['created_at'];
            data['is_admin_deleted'] = message['is_admin_deleted'] ? true : false;
            message['read'] = true;
            await message.save();
            return data;
          }),
        );
        return responseHelper(true, MESSAGES_LIST, 200, '', resData, res);
      }
      return responseHelper(false, CONVERSATION_NOT_EXIST, 404, '', {}, res);
    } catch (error) {
      console.log(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  readMessage: async (req, res, next) => {
    try {
      const message_id = req.body.message_id;
      const read = await Message.findByIdAndUpdate({ _id: message_id }, { $set: { read: true } });

      return responseHelper(true, MESSAGE_READ, 200, '', {}, res);
    } catch (error) {
      console.log(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  unreadMessage: async (req, res, next) => {
    try {
      const message_id = req.body.message_id;
      const unread = await Message.findByIdAndUpdate({ _id: message_id }, { $set: { read: false } });
      return responseHelper(true, MESSAGE_UNREAD, 200, '', {}, res);
    } catch (error) {
      console.log(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  deleteMessage: async (req, res, next) => {
    try {
      const message_id = req.params.message_id;

      const delMessage = await Message.findOne({ _id: req.params.message_id });

      if (req.user.user_id + '' !== delMessage.sender_id + '') {
        return responseHelper(false, 'Invalid user cannot delete', 409, '', {}, res);
      }

      await delMessage.remove();

      return responseHelper(true, "Messages deleted successfully", 200, '', {}, res);
    } catch (error) {
      console.log(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  // for employers----------------------------------------

  // for admins-------------------------------------------
  adminDeleteMessage: async (req, res, next) => {
    try {
      const message_id = req.params.message_id;
      const permission = await AdminDetail.findOne({ user_id: req.user.user_id }, 'permissions')
      const read_message = permission.permissions.read_messages;
      if (read_message == false) {
        return responseHelper(false, 'User does not have write permission', 409, '', {}, res);
      }

      const status = await Message.findByIdAndUpdate({ _id: message_id }, { $set: { is_admin_deleted: true, message: null } });

      return responseHelper(true, "Message deleted successfuly", 200, '', {}, res);
    } catch (error) {
      console.log(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  // admin get conversations
  adminGetConversations: async (req, res, next) => {
    try {
      let filter = { $or: [{ conversation_type: 'b-w' }, { conversation_type: 'b-b' }] }
      const { limit, skip } = await paginationHelper(req, 1, 7);

      if (req.query.name) {
        const searchUser = await WorkerDetail.find({
          $or: [{ 'first_name': { '$regex': req.query.name, '$options': 'i' } }, { 'last_name': { '$regex': req.query.name, '$options': 'i' } }]
        })
        const searchEmp = await CompanyMember.find({
          $or: [{ 'first_name': { '$regex': req.query.name, '$options': 'i' } }, { 'last_name': { '$regex': req.query.name, '$options': 'i' } }]
        })

        let coordinate_user = searchUser.map(searchCandidte => { return searchCandidte.user_id; });
        let coordinate_emp = searchEmp.map(searchCandidte => { return searchCandidte.user_id; });
        const data = [...coordinate_emp, ...coordinate_user]

        filter = { $and: [{ members: { $in: data } }, { $or: [{ conversation_type: 'b-w' }, { conversation_type: 'b-b' }] }] }
      }

      const messages = await Conversation.find(filter)
        .select('members created_at messages job_id conversation_type')
        .populate({ path: 'message_list', options: { sort: { created_at: -1 } } })
        .populate({ path: 'job', populate: { path: 'company', select: { profile_image: 1, company_name: 1 } } })
        .skip(skip)
        .limit(limit)
        .sort({ updated_at: -1 });

      const resData = await Promise.all(
        messages.map(async (message) => {
          const data = {};
          await Promise.all(
            message.members.map(async (member) => {
              data['members'] = [];
              let userDetail;
              const user = await User.findOne({ _id: member }).select('role').lean();
              if (user['role'] == 'worker') {
                userDetail = await WorkerDetail.findOne({ user_id: member }).select('first_name last_name profile_image');
              } else {
                userDetail = await CompanyMember.findOne({ user_id: member }).select('first_name last_name profile_image');
              }
              data['members'].push(userDetail);
            }),
          );
          data['message'] = message.message_list[0];
          data['conversation_id'] = message['_id'];
          data['job_id'] = message['job_id'];
          data['job'] = message['job'];
          data['created_at'] = message.created_at;
          return data;
        }),
      );
      return responseHelper(true, MESSAGES_LIST, 200, '', resData, res);
    } catch (error) {
      console.log(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  // admin get conversation messages
  adminGetConversationMessages: async (req, res, next) => {
    try {
      const { limit, skip } = await paginationHelper(req, 1, 7);
      if (await Conversation.findOne({ _id: ObjectId(req.params['conversation_id']) })) {
        const { message_list } = await Conversation.findOne({ _id: ObjectId(req.params['conversation_id']) })
          .select('messages')
          .populate({
            path: 'message_list', options: { sort: { 'created_at': -1 }, limit, skip }, populate: {
              path: 'sender',
              select: { '_id': 1, 'role': 1 },
            },
          });
        const resData = await Promise.all(
          message_list.map(async (message) => {
            const data = {};
            if (message.sender['role'] == 'worker') {
              const { first_name, last_name, profile_image } = await WorkerDetail.findOne({ user_id: message['sender_id'] })
                .select('first_name last_name profile_image');
              data['name'] = `${first_name} ${last_name}`;
              data['profile_image'] = profile_image;
            }
            if (message.sender['role'] == 'employer') {
              const { first_name, last_name, profile_image } = await CompanyMember.findOne({ user_id: message['sender_id'] })
                .select('first_name last_name');
              data['name'] = `${first_name} ${last_name}`;
              data['profile_image'] = profile_image;
            }
            data['message'] = message['message'];
            data['read'] = message['read'];
            data['sender_id'] = message['sender_id'];
            data['conversation_id'] = req.params['conversation_id'];
            data['created_at'] = message['created_at'];
            data['message_id'] = message['_id']
            message['read'] = message['read'];
            data['is_admin_deleted'] = message['is_admin_deleted'] ? true : false;

            await message.save();
            return data;
          }),
        );
        return responseHelper(true, MESSAGES_LIST, 200, '', resData, res);
      }
      return responseHelper(false, CONVERSATION_NOT_EXIST, 404, '', {}, res);
    } catch (error) {
      console.log(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  // admin support tab search conversation
  adminSupportConversation: async (req, res, next) => {
    try {

      const check_permission = await AdminDetail.findOne({ user_id: req.user.user_id, 'permissions.read_support_messages': false })
      if (check_permission) {
        return responseHelper(false, 'User does not have permission to read support message', 400, '', {}, res);
      }

      let filter = { members: { $in: [req.user['user_id']] } }
      const { limit, skip } = await paginationHelper(req, 1, 7);

      if (req.query.name) {
        const searchUser = await WorkerDetail.find({
          $or: [{ 'first_name': { '$regex': req.query.name, '$options': 'i' } }, { 'last_name': { '$regex': req.query.name, '$options': 'i' } }]
        })
        const searchEmp = await CompanyMember.find({
          $or: [{ 'first_name': { '$regex': req.query.name, '$options': 'i' } }, { 'last_name': { '$regex': req.query.name, '$options': 'i' } }]
        })

        let coordinate_user = searchUser.map(searchCandidte => { return searchCandidte.user_id; });
        let coordinate_emp = searchEmp.map(searchCandidte => { return searchCandidte.user_id; });
        const data = [...coordinate_emp, ...coordinate_user]

        filter = { $and: [{ members: { $in: data } }, { members: { $in: [req.user['user_id']] } }, { $or: [{ conversation_type: 'b-a' }, { conversation_type: 'w-a' }] }] }
      }

      const messages = await Conversation.find(filter)
        .select('members created_at messages job_id')
        .populate({ path: 'message_list', options: { sort: { created_at: -1 }, } })
        .populate({ path: 'job', populate: { path: 'company', select: { profile_image: 1, company_name: 1 } }, })
        .skip(skip)
        .limit(limit)
        .sort({ updated_at: -1 });
      const resData = await Promise.all(
        messages.map(async (message) => {
          const data = {};
          await Promise.all(
            message.members.map(async (member) => {
              const user = await User.findOne({ _id: member }).select('role').lean();
              if (member.toString() != req.user['user_id'].toString()) {
                if (user['role'] == 'worker') {
                  const { first_name, last_name, profile_image } = await WorkerDetail.findOne({ user_id: member })
                    .select('first_name last_name profile_image');
                  data['name'] = `${first_name} ${last_name}`;
                  data['profile_image'] = profile_image;
                } if (user['role'] == 'employer') {
                  const { first_name, last_name, profile_image } = await CompanyMember.findOne({ user_id: member })
                    .select('first_name last_name profile_image');
                  data['name'] = `${first_name} ${last_name}`;
                  data['profile_image'] = profile_image;
                }
                data['receiver_id'] = member;
              }
            }),
          );
          data['message'] = message.message_list[0];
          data['conversation_id'] = message['_id'];
          data['job_id'] = message['job_id'];
          data['job'] = message['job'];
          data['created_at'] = message.created_at;
          return data;
        }),
      );
      return responseHelper(true, MESSAGES_LIST, 200, '', resData, res);
    } catch (error) {
      console.log(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  // admin mark ticket as resolved
  adminResolveTicket: async (req, res, next) => {
    try {
      const conversation_id = req.query.conversation_id;
      const status = req.query.status;

      const message = await Conversation.find({ _id: conversation_id }, 'messages');

      let findMessage = message.map(messages => { return messages.messages; });

      const message_id = { ...findMessage }

      const resolveTicket = await Message.updateMany({ _id: { $in: message_id[0] } }, { $set: { ticket: status } });

      return responseHelper(true, 'Marked As Resolved', 200, '', status, res);

    } catch (error) {
      console.log(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  }
};

const getConversationType = async (sender_id, receiver_id) => {
  const sender = await User.findOne({ _id: sender_id }).lean();
  const receiver = await User.findOne({ _id: receiver_id }).lean();

  if (sender['role'] == 'worker' && receiver['role'] == 'worker') {
    const sender_detail = await WorkerDetail.findOne({ user_id: sender_id }).lean();
    const receiver_detail = await WorkerDetail.findOne({ user_id: receiver_id }).lean();
    return { sender_detail, receiver_detail, conversation_type: 'w-w' };
  }
  if (sender['role'] == 'employer' && receiver['role'] == 'employer') {
    const sender_detail = await CompanyMember.findOne({ user_id: sender_id }).lean();
    const receiver_detail = await CompanyMember.findOne({ user_id: receiver_id }).lean();
    return { sender_detail, receiver_detail, conversation_type: 'b-b' };
  }
  if (sender['role'] == 'employer' && receiver['role'] == 'worker') {
    const sender_detail = await CompanyMember.findOne({ user_id: sender_id }).lean();
    const receiver_detail = await WorkerDetail.findOne({ user_id: receiver_id }).lean();
    return { sender_detail, receiver_detail, conversation_type: 'b-w' };
  }
  if (sender['role'] == 'worker' && receiver['role'] == 'employer') {
    const sender_detail = await WorkerDetail.findOne({ user_id: sender_id }).lean();
    const receiver_detail = await CompanyMember.findOne({ user_id: receiver_id }).lean();
    return { sender_detail, receiver_detail, conversation_type: 'b-w' };
  }
  if (sender['role'] == 'employer' && ((receiver['role'] == 'admin') || (receiver['role'] == 'super-admin'))) {
    const sender_detail = await CompanyMember.findOne({ user_id: sender_id }).lean();
    const receiver_detail = await AdminDetail.findOne({ user_id: receiver_id }).lean();
    return { sender_detail, receiver_detail, conversation_type: 'b-a' };
  }
  if (((sender['role'] == 'admin') || (sender['role'] == 'super-admin')) && receiver['role'] == 'employer') {
    const sender_detail = await AdminDetail.findOne({ user_id: sender_id }).lean();
    const receiver_detail = await CompanyMember.findOne({ user_id: receiver_id }).lean();
    return { sender_detail, receiver_detail, conversation_type: 'b-a' };
  }
  if (sender['role'] == 'worker' && ((receiver['role'] == 'admin') || (receiver['role'] == 'super-admin'))) {
    const sender_detail = await WorkerDetail.findOne({ user_id: sender_id }).lean();
    const receiver_detail = await AdminDetail.findOne({ user_id: receiver_id }).lean();
    return { sender_detail, receiver_detail, conversation_type: 'w-a' };
  }
  if (((sender['role'] == 'admin') || (sender['role'] == 'super-admin')) && receiver['role'] == 'worker') {
    const sender_detail = await AdminDetail.findOne({ user_id: sender_id }).lean();
    const receiver_detail = await WorkerDetail.findOne({ user_id: receiver_id }).lean();
    return { sender_detail, receiver_detail, conversation_type: 'w-a' };
  }
  if (((sender['role'] == 'admin') || (sender['role'] == 'super-admin')) && ((receiver['role'] == 'admin') || (receiver['role'] == 'super-admin') || (receiver['role'] == 'worker'))) {
    const sender_detail = await AdminDetail.findOne({ user_id: sender_id }).lean();
    const receiver_detail = await WorkerDetail.findOne({ user_id: receiver_id }).lean();
    return { sender_detail, receiver_detail, conversation_type: 'w-a' };
  }
  if (((sender['role'] == 'admin') || (sender['role'] == 'super-admin')) && ((receiver['role'] == 'admin') || (receiver['role'] == 'super-admin') || (receiver['role'] == 'employer'))) {
    const sender_detail = await AdminDetail.findOne({ user_id: sender_id }).lean();
    const receiver_detail = await WorkerDetail.findOne({ user_id: receiver_id }).lean();
    return { sender_detail, receiver_detail, conversation_type: 'b-a' };
  }
};

