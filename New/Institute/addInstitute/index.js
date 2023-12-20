const AWS = require("aws-sdk");
const mongoose = require("mongoose");
const instituteSchema = require("./validations");
const Institute = require('./schema');

mongoose.connect("mongodb://upmyranks:upmyranks@docdb-2023-04-09-13-10-41.cgaao9qpsg6i.ap-south-1.docdb.amazonaws.com:27017/upmyranks?ssl=true&retryWrites=false",
  { useNewUrlParser: true, useUnifiedTopology: true });

exports.handler = async (event, context, callback) => {
  const { error } = instituteSchema.validate(event);
  console.log("event", event)
  if (error) {
    console.log("valErr", error)
    return {
      statusCode: 400,
      message: error.details[0].message,
    };
  }

  let buf;

  if (event.logo) {
    buf = Buffer.from(
      event.logo.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );
  }

  try {
    if (buf) {
      await uploadObjectToS3Bucket(event, buf);
    }

    const { unique, name } = await checkUniqueness(event.name);
    if (!unique) {
      const nonUniqueFields = [];

      if (!name) nonUniqueFields.push("name");

      return {
        statusCode: 400,
        message: `with this ${nonUniqueFields[0]} institute already exists...`
      };
    }

    const instituteData = new Institute({
      name: event.name,
      logo: buf ? `allassestsupmyranks/courseimages/${new Date().toISOString()}_${event.name}.png` : '',
      isActive: event.isActive,
      courseIds: event.courseIds,
      expiryDate: event.expiryDate,
      branchStudentLimit: event.branchStudentLimit,
      branchTeacherLimit: event.branchTeacherLimit,
      branchNonTeacherLimit: event.branchNonTeacherLimit,
      studentLimit: event.studentLimit,
      teacherLimit: event.teacherLimit,
      nonTeacherLimit: event.nonTeacherLimit,
    });

    await instituteData.save();

    return {
      statusCode: 200,
      message: "Institute Added Successfully"
    };
  } catch (err) {
    console.log("err", err)
    return {
      statusCode: 500,
      message: err.message
    };
  }
};

async function checkUniqueness(name) {
  const nameCheck = await checkUniquenessField("name", institute_name);
  return { unique: nameCheck, name: nameCheck };
}

async function checkUniquenessField(fieldName, fieldValue) {
  const existingInstitute = await Institute.findOne({ [fieldName]: fieldValue });
  return !existingInstitute;
}

function uploadObjectToS3Bucket(event, data) {
  const s3 = new AWS.S3();
  const params = {
    Bucket: "allassestsupmyranks",
    Key: `courseimages/${event.name}.png`,
    Body: data,
  };

  return s3.upload(params).promise();
}
