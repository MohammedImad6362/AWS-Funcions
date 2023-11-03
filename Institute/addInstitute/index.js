let AWS = require("aws-sdk");
let dynamodb = new AWS.DynamoDB.DocumentClient({ region: "ap-south-1" });
const s3 = new AWS.S3({ region: "ap-south-1" });
const { v4: uuidv4 } = require("uuid");
const Joi = require('joi')

exports.handler = async (event, context, callback) => {

  const schema = Joi.object({
    institute_id: Joi.string().required(),
    address: Joi.string(),
    area: Joi.string(),
    branches: Joi.array(),
    code:Joi.string().required(),
    city: Joi.string(),
    contact_no: Joi.string(),
    course_ids: Joi.array(),
    email: Joi.string().required(),
    expiry_date: Joi.string().required,
    logo: Joi.string().required(),
    name: Joi.string().required(),
    nonteacher_limit: Joi.string().required(),
    question_limit: Joi.string(),
    state: Joi.string(),
    status: Joi.string(),
    student_limit: Joi.string().required(),
    teacher_limit: Joi.string().required(),
    user_name: Joi.string().required(),
    password: Joi.string().required(),
    user_role: Joi.string(),
  });

  const { error } = schema.validate(event);

  if (error) {
    return {
      statusCode: 400,
      body: {
        error: 'Bad Request',
        msg: error.details[0].message,
      },
    };
  }

  // Check uniqueness of institute_name, code, and email
  const { unique, name, code, email } = await checkUniqueness(event.institute_name, event.code, event.email);
  if (!unique) {
    const nonUniqueFields = [];

    if (!name) nonUniqueFields.push("institute_name");
    if (!code) nonUniqueFields.push("code");
    if (!email) nonUniqueFields.push("email");

    callback(null, {
      status_code: 400,
      response: `${nonUniqueFields.join(", ")} already exists...`,
    });
    return;
  }


  var buf = Buffer.from(
    event.logo.replace(/^data:image\/\w+;base64,/, ""),
    "base64"
  );

  await uploadObjectToS3Bucket(event, buf)
    .then(async () => {
      const instituteData = {
        institute_id: createUniqueID(),
        address: event.address || "",
        area: event.area || "",
        branches: [],
        code: event.code,
        city: event.city || "",
        contact_no: event.contact_no || "",
        course_ids: event.course_ids || [],
        email: event.email,
        expiry_date: event.expiry_date,
        logo: "allassestsupmyranks/courseimages/" + event.institute_id + ".png",
        name: event.institute_name,
        nonteacher_limit: event.nonteacher_limit,
        question_limit: event.question_limit || "",
        state: event.state || "",
        status: event.status || "",
        student_limit: event.student_limit,
        teacher_limit: event.teacher_limit,
        user_name: event.user_name,
        password: event.password,
        user_role: "INSTITUTE",
      };

      await put_institute(instituteData)
        .then(() => {
          callback(null, {
            status_code: 200,
            response: "Institute Added Successfully",
          });
        })
        .catch((err) => {
          callback(null, {
            status_code: 500,
            response: err,
          });
        });
    })
    .catch((error) => {
      callback(null, {
        status_code: 500,
        response: error,
      });
    });
};

async function checkUniqueness(institute_name, code, email) {
  const nameCheck = await checkUniquenessField("name", institute_name);

  const codeCheck = await checkUniquenessField("code", code);

  const emailCheck = await checkUniquenessField("email", email);

  return { unique: nameCheck && codeCheck && emailCheck, name: nameCheck, code: codeCheck, email: emailCheck };
}

async function checkUniquenessField(fieldName, fieldValue) {
  const params = {
    TableName: "Institute",
    IndexName: `${fieldName}-index`,
    KeyConditionExpression: `#field = :value`,
    ExpressionAttributeValues: {
      ":value": fieldValue,
    },
    ExpressionAttributeNames: {
      "#field": fieldName,
    },
  };

  const result = await dynamodb.query(params).promise();
  return result.Items.length === 0;
}

function uploadObjectToS3Bucket(event, Data) {
  const params = {
    Bucket: "allassestsupmyranks",
    Key: `courseimages/${event.institute_id}.png`,
    Body: Data,
  };

  return s3.upload(params).promise();
}

function put_institute(instituteData) {
  let params = {
    Item: instituteData,
    TableName: "Institute",
  };

  return dynamodb.put(params).promise();
}

function createUniqueID() {
  const timestamp = new Date().getTime();
  const randomUUID = uuidv4().replace(/-/g, "");
  return `${timestamp}-${randomUUID}`;
}
