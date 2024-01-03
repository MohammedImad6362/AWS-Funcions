const mongoose = require('mongoose');
const Joi = require('joi');
const multipart = require('lambda-multipart-parser');
const AWS = require('aws-sdk')
const s3 = new AWS.S3({ region: 'ap-south-1' })

const authorValidationSchema = Joi.object({
  name: Joi.string().required(),
  profileImage: Joi.string()
});

const authorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  profileImage: { type: String },
  deleted: { type: Boolean, default: false },
}, {
  timestamps: true
});

const Author = mongoose.model('Author', authorSchema);

exports.handler = async (event) => {
  try {
    const formData = await multipart.parse(event, false);
    const { files, profileImage } = formData;
    delete formData.files;

    const { error } = authorValidationSchema.validate(formData);

    if (error) {
      console.log("Valerror", error)
      return {
        statusCode: 400,
        body: JSON.stringify({ message: error.details[0].message })
      };
    }

    await mongoose.connect('mongodb://upmyranks:upmyranks@docdb-2023-04-09-13-10-41.cgaao9qpsg6i.ap-south-1.docdb.amazonaws.com:27017/upmyranks?ssl=true&retryWrites=false');
    console.log("Connected to DB");

    const authorData = {
      name: formData.name,
      profileImage: formData.profileImage
    };

    console.log("Ad", authorData)

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
        authorData.profileImage = profileImage;
      } catch (s3Error) {
        if (s3Error.code === "NotFound") {
          return {
            body: JSON.stringify({ message: "No image found in S3 with this filePath" }),
          };
        } else {
          throw s3Error;
        }
      }
    }

    if (files && files[0]?.content) {
      const contentType = files[0].contentType;

      if (!contentType.startsWith("image/")) {
        return {
          body: JSON.stringify({ message: "File must be an image file" }),
        };
      }

      const key = `authorProfileImages/${new Date().toISOString()}_${formData.name}`;
      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: files[0].content,
        ContentType: files[0].contentType,
      };

      const s3UploadResponse = await s3.upload(params).promise();
      console.log("S3Res", s3UploadResponse)
      console.log("S3Res", s3UploadResponse.Location)

      authorData.profileImage = s3UploadResponse.Location;
      console.log("Ad2", authorData)
    }

    await Author.create(authorData);

    await mongoose.disconnect();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Author added successfully" })
    };
  } catch (error) {
    console.error('Error creating author:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error creating author' })
    }
  }
};


