const AWS = require("aws-sdk");
const uuid = require("uuid");
const multipart = require("lambda-multipart-parser");

AWS.config.update({ region: "ap-south-1" });
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

const S3_BUCKET_NAME = "demotestproducts";
const DYNAMODB_TABLE_NAME = "QuestionDocs";

exports.handler = async (event) => {
  try {
    const formData = await multipart.parse(event, true);
    if (!formData.files || formData.files.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "No file uploaded" }),
      };
    }

    const uploadedFile = formData.files[0];

    if (!uploadedFile.filename.toLowerCase().endsWith(".docx")) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Uploaded file must be a docx file",
        }),
      };
    }
    const { filename, content } = uploadedFile;
    const { instituteId } = formData;
    const processingId = uuid.v4();
    const s3Key = `question-docs/${processingId}_${filename}`;

    // Upload the DOCX file to S3
    await s3
      .putObject({ Bucket: S3_BUCKET_NAME, Key: s3Key, Body: content })
      .promise();

    // Record processing status in DynamoDB
    const params = {
      TableName: DYNAMODB_TABLE_NAME,
      Item: {
        processingId,
        filename,
        status: "processing",
        createdAt: new Date(),
        instituteId,
      },
    };
    await dynamodb.put(params).promise();

    // Respond to the user with processing ID and message
    const response = {
      statusCode: 200,
      body: JSON.stringify({
        processingId,
        message: "File is processing",
      }),
    };
    return response;
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
