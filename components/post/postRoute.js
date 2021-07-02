const {workerValidation, postValidation, adminValidation} = require('../../helpers/inputValidation');
const PostController = require('./postController');


module.exports = (router, passport) => {
  // for all user------------------------------------

  // for workers-------------------------------------
  router.post('/worker/add-post', passport.authenticate('bearer', {session: false}), workerValidation, postValidation, PostController.addNewPost);
  router.get('/worker/get-posts', passport.authenticate('bearer', {session: false}), workerValidation, PostController.getPosts);
  router.delete('/worker/post/:post_id', passport.authenticate('bearer', {session: false}), workerValidation, PostController.deletePost);
  router.get('/worker/post/:post_id', passport.authenticate('bearer', {session: false}), workerValidation, PostController.getPost);
  router.get('/worker/post/:post_id/like-unlike', passport.authenticate('bearer', {session: false}), workerValidation, PostController.likeUnlikePost);
  router.post('/worker/post/:post_id/comment', passport.authenticate('bearer', {session: false}), workerValidation, PostController.commentPost);
  router.delete('/worker/comment/:comment_id', passport.authenticate('bearer', {session: false}), workerValidation, PostController.deleteComment);

  // for employers-----------------------------------

  // for admins---------------------------------------
  router.post('/admin/get-posts', passport.authenticate('bearer', {session: false}), adminValidation, PostController.adminGetPosts);
  router.delete('/admin/deleteComment/:comment_id', passport.authenticate('bearer', {session: false}), adminValidation, PostController.adminDeleteComment);
  router.delete('/admin/deletePost/:post_id', passport.authenticate('bearer', {session: false}), adminValidation, PostController.adminDeletePost);
};


