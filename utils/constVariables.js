module.exports = {
  // http response messages
  SERVER_ERROR: 'Internal server error',
  NO_ACCESS: 'No access',
  MAIL_FAILED: 'User Successfully Created!',
  MAIL_SUCCESS: 'Email has been sent in your email address. Please check!',
  TOKEN_EXIST: 'Authorization successful',
  TOKEN_NOT_EXIST: 'Token does not exist',

  // user related
  USER_ADDED: 'User Successfully Created!',
  USER_FOLLOW_ALREADY_REQUESTED: 'User already requested for connection',
  USER_ALREADY_FOLLOWED: 'User already in connection list',
  USER_FOLLOW_REQUESTED: 'User connection requested successfully',
  USER_LIST: 'Users retrieved successfully',
  USER_FOLLOW_ACCEPTED: 'User request accepted successfully',
  USER_FOLLOW_IGNORED: 'Users request ignored successfully',
  USER_SUGGESTION_LIST: 'User suggestions retrieved successfully',
  USER_UNFOLLOWED:'User unfollowed successful',

  CANDIDATE_DOES_NOT_EXISTS: 'Candidate does not exists',
  CANDIDATE_LISTS: 'List of candidates retrieved successfully',

  // category related
  CATEGORY_LIST: 'List of categories retrieved',
  CATEGORY_ADDED: 'Category created successfully',
  CATEGORY_EXISTS: 'Category already exists',
  CATEGORY_SKILLS_RETRIEVED: 'Category skills retrieved successfully',

  // job related
  JOB_LIST: 'List of jobs retrieved',
  JOB_ADDED: 'Job created successfully',
  JOB_DETAIL: 'Job retrieved successfully',
  JOB_APPLIED: 'Job applied successfully',
  JOB_ALREADY_APPLIED: 'Job already applied',
  JOB_FAVOURITE: 'Job added to favourite list',
  JOB_UNFAVOURITE: 'Job removed from favourite list',
  JOB_UPDATED: 'Job updated successfully',
  JOB_ALREADY_SAVED: 'Job already saved',
  JOB_SAVED: 'Job saved successfully',
  JOB_UNSAVED: 'Job removed from saved successfully',
  JOB_ACTIVATED: 'Job activated successfully',
  JOB_DEACTIVATED: 'Job deactivated successfully',
  JOB_NOT_FOUND: 'Job does not exist',

  // company related
  COMPANY_LIST: 'List of companies retrieved',
  COMPANY_ADDED: 'Company created successfully',
  COMPANY_UPDATED: 'Company updated successfully',
  COMPANY_EXISTS: 'Company already registered',
  COMPANY_DETAIL: 'Company detail retrieved',
  COMPANY_JOBS_LIST: 'Company jobs retrieved successfully',
  COMPANY_UNFOLLOWED: 'Company unfollowed successfully',
  COMPANY_FOLLOWED: 'Company followed successfully',
  COMPANY_SAVED: 'Company saved successfully',
  COMPANY_UNSAVED: 'Company removed from saved list successfully',
  COMPANY_DEACTIVATED: 'Company deactivated successfully',
  COMPANY_ACTIVATED: 'Company activated successfully',


  // user profile related
  PROFILE_UPDATED: 'Your profile has been successfully updated!',
  PROFILE_RETRIEVED: 'Your profile detail retrieved successfully',

  // application related
  NEW_APPLICATION: 'You have got a new application {name}',
  APPLICATION_PHASE_CHANGED: 'Application phased changed successfully',

  // file related
  FILE_UPLOAD_SUCCESS: 'File has been uploaded successfully',
  FILE_UPDATE_SUCCESS: 'Image has been updated successfully',
  FILES_REQUIRED: 'Image is required',
  FILES_FORMAT_ERROR: 'Image format must be in jpg, jpeg or png',
  FILE_UPLOAD_FAILED: 'File upload failed',

  // post related
  POST_ADDED: 'Post created successfully',
  POST_LIKED: 'Post liked successfully',
  POST_UNLIKED: 'Post unliked successfully',
  POST_NOT_FOUND: 'Post does not exist',
  POST_DELETED: 'Post deleted successfully',
  POST_LISTS: 'Posts retrieved successfully',
  POST_RETRIEVED: 'Post detail retrieved successfully',

  // comment related
  COMMENT_SUCCESS: 'Comment on the post success',

  // message related
  CONVERSATION_NOT_EXIST: 'Conversation does not exist',
  MESSAGE_SENT: 'Message sent successfully',
  MESSAGES_LIST: 'Conversations list retrieved',
  MESSAGE_READ: 'Message set as read',
  MESSAGE_UNREAD: 'Message set as unread',

  // common
  AUTH_SUCCESS: 'User successfully logged in',
  LOGOUT_SUCCESS: 'You have successfully logged out. Bye,See you again!',

  UNAUTHORIZED: 'Unauthorized',
  UNAUTHORIZED_CLIENT: 'Unauthorized client',

  USER_PASS_NOT_MATCH: 'Please enter correct Password!',
  USER_OLD_PASS_NOT_MATCH: `Password did not match!`,
  USER_NOT_FOUND: 'Could not find your email address. Please Sign-up first!',
  NOT_FOUND:'User not found',
  USER_EMAIL_EXISTS: 'User email already exists',
  USER_PASSWORD_CHANGED: 'Password has been successfully changed!',
  INVALID_EMAIL: 'Please enter valid email address!',
  INVALID_PASS: 'Password must contain at least one number and one uppercase and lowercase letter, and at least 8 or more characters.',
  INVALID_TIME: `Please use 'HH:MM AM/PM' format for the time`,

  // Regex
  EMAIL_REG: /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/,
  PASS_REG: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/,
  TIME_REG: /((1[0-2]|0?[1-9]):([0-5][0-9]) ?([AaPp][Mm]))/,
}
;
