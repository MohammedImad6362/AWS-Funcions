const mongoose = require('mongoose');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const multipart = require('lambda-multipart-parser');
const AWS = require('aws-sdk')
const s3 = new AWS.S3({ region: 'ap-south-1' })

const authorValidationSchema = Joi.object({
  name: Joi.string(),
  profileImage: Joi.string()
});

const authorSchema = new mongoose.Schema({
  name: String,
  profileImage: String
}, {
  timestamps: true
});

const Author = mongoose.model('Author', authorSchema);

exports.handler = async (event) => {
  try {
    console.log("event", event)
    const authorId = event.pathParameters.id;
    const { error: idError } = Joi.object({
      authorId: Joi.objectId().required(),
    }).validate({ authorId });

    if (idError) {
      console.log('err', idError);
      return response({
        statusCode: 400,
        body: JSON.stringify({ message: idError.details[0].message }),
      });
    }

    const reqBody = await multipart.parse(event, false);
    console.log("req", reqBody)
    const { files, profileImage } = reqBody;
    delete reqBody.files;

    const { error } = authorValidationSchema.validate(reqBody);

    if (error) {
      console.log("Valerror", error)
      return response({
        statusCode: 400,
        body: JSON.stringify({ message: error.details[0].message })
      });
    }

    await mongoose.connect('mongodb://upmyranks:upmyranks@docdb-2023-04-09-13-10-41.cgaao9qpsg6i.ap-south-1.docdb.amazonaws.com:27017/upmyranks?ssl=true&retryWrites=false');
    console.log("Connected to DB");

    const BUCKET_NAME = "allassestsupmyranks";

    if (profileImage) {
      const originalPath = new URL(profileImage).pathname;
      const correctedPath = originalPath.replace(/%20/g, " "); //converting % to empty space as actual path
      console.log("Cp", correctedPath)
      const s3HeadParams = {
        Bucket: BUCKET_NAME,
        Key: correctedPath.slice(1),
      };

      try {
        await s3.headObject(s3HeadParams).promise();
        reqBody.profileImage = profileImage;
      } catch (s3Error) {
        if (s3Error.code === "NotFound") {
          return response({
            body: JSON.stringify({ message: "No image found in S3 with this filePath" }),
          });
        } else {
          throw s3Error;
        }
      }
    }

    if (files && files[0]?.content) {
      const contentType = files[0].contentType;

      if (!contentType.startsWith("image/")) {
        return response({
          body: JSON.stringify({ message: "File must be an image file" }),
        });
      }

      const key = `authorProfileImages/${new Date().toISOString()}_${authorId}`;
      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: files[0].content,
        ContentType: files[0].contentType,
      };

      const s3UploadResponse = await s3.upload(params).promise();
      console.log("S3Res", s3UploadResponse)
      console.log("S3Res", s3UploadResponse.Location)

      reqBody.profileImage = s3UploadResponse.Location;
      console.log("updReq", reqBody)
    }

    const updatedAuthor = await Author.findByIdAndUpdate(
      authorId,
      { $set: { ...reqBody } });

    console.log("data", updatedAuthor);

    await mongoose.disconnect();

    if (!updatedAuthor) {
      return response({
        statusCode: 404,
        body: JSON.stringify({ message: 'Author not found' }),
      });
    }

    return response({
      statusCode: 200,
      body: JSON.stringify({ message: 'Author updated successfully' }),
    });
  } catch (error) {
    console.error('Error updating author:', error);
    return response({
      statusCode: 500,
      body: JSON.stringify({ message: 'Error updating author' }),
    });
  }
};

const response = (res) => {
  return {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    statusCode: res.statusCode,
    body: res.body,
  };
};
