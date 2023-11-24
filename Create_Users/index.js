const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient({ region: "ap-south-1" });
const { v4: uuidv4 } = require("uuid");
const cognito = new AWS.CognitoIdentityServiceProvider();
const { studentSchema, teacherSchema } = require('./validation.js');

exports.handler = async (event, context, callback) => {
  try {

    let userRole = event.user_role;

    let schema;

    if (userRole === 'STUDENT') {
      schema = studentSchema;
    } else if (userRole === 'TEACHER' || userRole === 'STAFF') {
      schema = teacherSchema;
    } else {
      return callback(null, {
        statusCode: 400,
        message: "Invalid role",
      });
    }

    const validationResult = schema.validate(event, { abortEarly: false });

    if (validationResult.error) {
      return callback(null, {
        statusCode: 400,
        message: validationResult.error.details.map((detail) => detail.message),
      });
    }

    // Create users in Cognito
    await signUpUserInCognito(event);

    // Create user based on role
    if (userRole.toLowerCase() === "student") {
      await Create_User_Student(event);
    } else if (
      userRole.toLowerCase() === "staff" ||
      userRole.toLowerCase() === "teacher"
    ) {
      await Create_User_Staff(event);
    } else {
      return callback(null, {
        statusCode: 400,
        message: "Invalid role",
      });
    }

    return callback(null, {
      statusCode: 200,
      message: "User Created",
    });
  } catch (error) {
    return callback(null, {
      statusCode: error.statusCode || 500,
      message: error.message || "Error on adding users",
    });
  }
};

// Function to generate a unique user ID
function createUniqueID() {
  const timestamp = new Date().getTime();
  const randomUUID = uuidv4().replace(/-/g, "");
  return `${timestamp}-${randomUUID}`;
}

// Create user in Cognito
const signUpUserInCognito = async (event) => {
  try {
    // Create users in Cognito
    await cognito.signUp({
      ClientId: '7k6a8mfavvsj2srjkqm828j5di',
      Password: event.password || event.admission_no,
      Username: event.userName,
      UserAttributes: [
        { Name: 'name', Value: `${event.firstname} ${event.lastname}` },
        { Name: 'email', Value: 'mailtest@gmail.com' },
        { Name: 'birthdate', Value: '10-08-1998' },
        { Name: 'phone_number', Value: `+91${event.mobile}` },
        { Name: 'custom:custom:role', Value: userRole },
      ],
    }).promise();
  }
  catch (error) {
    console.log('Cognito error', error);
    throw {
      statusCode: error.code === 'UsernameExistsException' ? 400 : 500,
      message: error.code === 'UsernameExistsException' ? 'User with this username already exists' : 'Error on adding users to Cognito'
    };
  }
};

// Create user in DynamoDB for student role
async function Create_User_Student(event) {
  const data = {
    TableName: "Users",
    Item: {
      user_id: `USER-${createUniqueID()}`,
      institute_id: event.institute_id,
      branch_id: event.branch_id,
      batch_id: event.batch_id,
      year: event.year,
      academic_year: event.academic_year,
      gender: event.gender,
      nationality: event.nationality,
      pincode: event.pincode,
      state: event.state,
      city: event.city,
      address: event.address,
      religion: event.religion,
      aadhar_no: event.aadhar_no,
      area_name: event.area_name,
      father_name: event.father_name,
      mother_name: event.mother_name,
      community: event.community,
      caste: event.caste,
      batch_name: event.batch_name,
      registration_type: event.registration_type,
      sats_no: event.sats_no,
      parent_mobile: event.parent_mobile,
      course: event.course,
      from: event.from,
      to: event.to,
      room_type: event.room_type,
      transportation_id: event.transportation_id,
      hostel_id: event.hostel_id,
      created_by: event.created_by,
      remarks: event.remarks,
      user_role: userRole,
      status: event.status,
      mobile: "+91" + event.mobile,
      lastname: event.lastname,
      firstname: event.firstname,
      dob: event.dob,
      fees_paid: [],
      password: event.password,
      status: event.status,
      userName: event.userName,
    },
  };

  return db.put(data).promise();
}

// Create user in DynamoDB for staff role
async function Create_User_Staff(event) {
  const data = {
    TableName: "Users",
    Item: {
      user_id: `USER-${createUniqueID()}`,
      firstname: event.firstname,
      lastname: event.lastname,
      dob: event.dob,
      mobile: "+91" + event.mobile,
      department: event.department,
      designation: event.designation,
      gender: event.gender,
      blood_group: event.blood_group,
      spouse_name: event.spouse_name,
      fathername: event.fathername,
      date_of_joining: event.date_of_joining,
      profile_pictute: event.profile_pictute,
      email: event.email,
      pincode: event.pincode,
      address: event.address,
      state: event.state,
      city: event.city,
      area_name: event.area_name,
      emergency_connumber: event.emergency_connumber,
      emergnecy_contact_person: event.emergnecy_contact_person,
      educational_background: event.educational_background,
      completion_year: event.completion_year,
      expericence: event.expericence,
      collage_cityname: event.collage_cityname,
      collage_name: event.collage_name,
      previous_institutename: event.previous_institutename,
      bank_account_no: event.bank_account_no,
      bank_branch: event.bank_branch,
      bank_ifsc: event.bank_ifsc,
      bank_name: event.bank_name,
      PAN_number: event.PAN_number,
      PF_account_number: event.PF_account_number,
      EPS_account_number: event.EPS_account_number,
      passport_expiry: event.passport_expiry,
      passport_no: event.passport_no,
      contract_start_date: event.contract_start_date,
      country_of_issue: event.country_of_issue,
      contract_type: event.contract_type,
      user_role: userRole,
      institute_id: event.institute_id,
      branch_id: event.branch_id,
      password: event.password,
      status: event.status,
      userName: event.userName,
    },
  };

  return db.put(data).promise();
}
