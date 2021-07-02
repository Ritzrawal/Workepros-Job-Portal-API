const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET,
});

module.exports = {
  awsUpload: async (file, fileName, ContentType) => {
    try {
    // Setting up S3 upload parameters
      const params = {
        'Bucket': process.env.AWS_BUCKET_NAME,
        'Key': fileName, // File name you want to save as in S3
        'Body': file,
        ContentType, // <-- this is what you need!
        'ACL': 'public-read', // <-- this makes it public so people can see it
      };

      // Uploading files to the bucket
      const data = await s3.upload(params).promise();
      logger.info(`File uploaded successfully. ${data.Location}`);
      return data.key;
    } catch (error) {
      console.log(error);
      logger.error(`File upload failed.`);
    }
  },
  awsDeleteFile: async (fileName) => {
    try {
      s3.deleteObject({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
      }, function(err, data) {
        if (err) {
          logger.error(err, err.stack);
          return false;
        } else {
          logger.info('file deleted');
          return true;
        } // deleted
      });
    } catch (error) {
      console.log(error);
      logger.error(`File delete failed.`);
    }
  },
};
