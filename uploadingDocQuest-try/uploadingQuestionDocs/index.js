const AWS = require('aws-sdk');
const multer = require('multer');
const upload = multer();

const s3 = new AWS.S3();

exports.handler = async (event, context) => {
  try {
    const { file } = event.body; // Assuming your form field is named 'file'

    // Upload the file to S3
    const s3Params = {
      Bucket: 'demotestproducts',
      Key: 'uploaded-files/' + file.originalname, // Specify the S3 key as needed
      Body: file.buffer,
    };

    await s3.upload(s3Params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify('File uploaded successfully'),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify('Error uploading file to S3'),
    };
  }
};
