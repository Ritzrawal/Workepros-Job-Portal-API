const {awsDeleteFile} = require('../../helpers/awsS3');
const responseHelper = require('../../helpers/responseHelper');
const {Post, Comment} = require('../../models');
const paginationHelper = require('../../helpers/paginationHelper');
const {
  POST_ADDED,
  POST_LISTS,
  POST_UNLIKED,
  POST_LIKED,
  POST_NOT_FOUND,
  COMMENT_SUCCESS,
  POST_DELETED,
  POST_RETRIEVED,
  SERVER_ERROR,
} = require('../../utils/constVariables');
const {ObjectId} = require('mongoose').Types;

module.exports = {
  // for all users----------------------------------------


  // for workers------------------------------------------
  addNewPost: async (req, res, next) => {
    try {
      const {message, files} = req['body'];
      const post = await Post.create({message, files, user_id: req.user['user_id']});
      return responseHelper(true, POST_ADDED, 200, '', post, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  getPosts: async (req, res, next) => {
    try {
      const {limit, skip} = await paginationHelper(req, 1, 7);
      const posts = await Post.find().select('user_id message created_at files user_likes user_comments').sort({created_at: -1})
          .populate({path: 'comments', select: {message: 1, user_id: 1, created_at: 1}, options: {sort: {'created_at': -1},limit, skip}, populate: {path: 'user', select: {first_name: 1, last_name: 1, profile_image: 1}}})
          .populate({path: 'user', select: {first_name: 1, last_name: 1, profile_image: 1}});
      const tempPosts = JSON.parse(JSON.stringify(posts));
      const responseData = await Promise.all(
          tempPosts.map(async (post) => {
            post['user_like_status'] = post['user_likes'].includes(req.user['user_id'].toString()) ? true : false;
            post['total_post_likes'] = post['user_likes'].length;
            delete post['user_comments'];
            delete post['user_likes'];
            return post;
          }),
      );
      return responseHelper(true, POST_LISTS, 200, '', responseData, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  getPost: async (req, res, next) => {
    try {
      const postId = ObjectId(req.params['post_id']);
      const posts = await Post.findOne({_id: postId}).populate({path: 'user', select: {first_name: 1, last_name: 1, profile_image: 1}});
      return responseHelper(true, POST_RETRIEVED, 200, '', posts, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  deletePost: async (req, res, next) => {
    try {
      const post = await Post.findOne({_id: req.params['post_id']});
      await Promise.all(
          post['files'].map(async (file) => {
            await awsDeleteFile(file);
          }),
      );
      await post.remove();
      return responseHelper(true, POST_DELETED, 200, '', {}, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  likeUnlikePost: async (req, res, next) => {
    try {
      const postId = ObjectId(req.params['post_id']);
      const post = await Post.findOne({_id: postId});
      const alreadyLiked = await Post.findOne({_id: postId, user_likes: {$in: [req.user['user_id']]}});
      if (alreadyLiked) {
        post['user_likes'].pull(req.user['user_id']);
      } else {
        post['user_likes'].push(req.user['user_id']);
      }
      await post.save();
      await responseHelper(true, alreadyLiked ? POST_UNLIKED : POST_LIKED, 200, '', {}, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  commentPost: async (req, res, next) => {
    try {
      const postId = ObjectId(req.params['post_id']);
      const comment = await Comment.create({user_id: req.user['user_id'], message: req.body['message']});
      const post = await Post.findOne({_id: postId});
      if (post) {
        post['user_comments'].push(comment['_id']);
        await post.save();
        return responseHelper(true, COMMENT_SUCCESS, 200, '', {}, res);
      }
      return responseHelper(false, POST_NOT_FOUND, 404, '', {}, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  deleteComment: async (req, res, next) => {
    try {
      const comment = await Comment.findOne({_id: req.params['comment_id']});
      const post = await Post.findOne({_id: req.body['post_id']});
  
      if((req.user.user_id.toString() == comment.user_id.toString()) || (req.user.user_id.toString == post.user_id.toString)){
        await comment.remove();
        return responseHelper(true, "Comment deleted successfully", 200, '', {}, res);
          
      }else{
        return responseHelper(false, 'Invalid user cannot delete', 409, '', {}, res);
      }
      
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
  // for employers----------------------------------------

  // for admins-------------------------------------------
  adminGetPosts: async (req, res, next) => {
    try {
      const posts = await Post.findAll({});
      return responseHelper(false, POST_LISTS, 200, '', posts, res);
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  adminDeleteComment: async (req, res, next) => {
    try {
      const comment = await Comment.findOne({_id: req.params['comment_id']});

      await comment.remove();
      return responseHelper(true, "Comment deleted successfully", 200, '', {}, res);
      
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },

  adminDeletePost: async (req, res, next) => {
    try {
      const post = await Post.findOne({_id: req.params['post_id']}); 
      await Promise.all(
        post['files'].map(async (file) => {
          await awsDeleteFile(file);
        }),
      );
      const post_comment = post['user_comments'];

      const comments = await Comment.deleteMany({_id: {$in: post_comment}});
      await post.remove();

      return responseHelper(true, "Post deleted successfully", 200, '', {}, res);
      
    } catch (error) {
      logger.error(error);
      return responseHelper(false, SERVER_ERROR, 500, '', {}, res);
    }
  },
};

