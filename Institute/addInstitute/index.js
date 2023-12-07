const AWS = require("aws-sdk");
const mongoose = require("mongoose");
const instituteSchema = require("./validations");
const Institute = require('./schema');

mongoose.connect("mongodb://upmyranks:upmyranks@docdb-2023-04-09-13-10-41.cgaao9qpsg6i.ap-south-1.docdb.amazonaws.com:27017/upmyranks?ssl=true&retryWrites=false", { useNewUrlParser: true, useUnifiedTopology: true });

exports.handler = async (event, context, callback) => {
  const { error } = instituteSchema.validate(event);
console.log("event",event)
  if (error) {
    console.log("valErr",error)
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: error.details[0].message,
      }),
    };
  }

  // const { unique, name, code, email } = await checkUniqueness(event.name, event.code, event.email);
  // if (!unique) {
  //   const nonUniqueFields = [];

  //   if (!name) nonUniqueFields.push("institute_name");
  //   if (!code) nonUniqueFields.push("code");
  //   if (!email) nonUniqueFields.push("email");

  //   return {
  //     statusCode: 400,
  //     body: JSON.stringify({ message: `${nonUniqueFields[0]} already exists...` })
  //   };
  // }

  var buf = Buffer.from(
    event.logo.replace(/^data:image\/\w+;base64,/, ""),
    "base64"
  );

  try {
    await uploadObjectToS3Bucket(event, buf);

    const instituteData = new Institute({
      name: event.name,
      logo: `allassestsupmyranks/courseimages/${new Date().toISOString()}_${event.name}.png`,
      isActive: event.isActive,
      courseIds: event.courseIds || [],
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
      body: JSON.stringify({ message: "Institute Added Successfully" })
    };
  } catch (err) {
    console.log("err",err)
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message })
    };
  }
};

// async function checkUniqueness(institute_name, code, email) {
//   const nameCheck = await checkUniquenessField("name", institute_name);
//   const codeCheck = await checkUniquenessField("code", code);
//   const emailCheck = await checkUniquenessField("email", email);

//   return { unique: nameCheck && codeCheck && emailCheck, name: nameCheck, code: codeCheck, email: emailCheck };
// }

// async function checkUniquenessField(fieldName, fieldValue) {
//   const existingInstitute = await Institute.findOne({ [fieldName]: fieldValue });
//   return !existingInstitute;
// }

function uploadObjectToS3Bucket(event, Data) {
  const s3 = new AWS.S3();
  const params = {
    Bucket: "allassestsupmyranks",
    Key: `courseimages/${event.institute_id}.png`,
    Body: Data,
  };

  return s3.upload(params).promise();
}
