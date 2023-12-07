const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient({ region: "ap-south-1" });
const { v4: uuidv4 } = require("uuid");
const cognito = new AWS.CognitoIdentityServiceProvider();
const { studentSchema, teacherSchema } = require('./validation.js')

exports.handler = async (event, context, callback) => {

  try {
    const validationResult = validateInput(event);
    if (validationResult.statusCode !== 200) {
      return validationResult;
    }
    await signUpUserInCognito(event);

    if (event.user_role.toLowerCase() === "student") {
      await Create_User_Student(event);
    }
    else if (
      event.user_role.toLowerCase() === "staff" ||
      event.user_role.toLowerCase() === "teacher"
    ) {
      await Create_User_Staff(event);
    }
    else {
      return callback(null, {
        statusCode: 400,
        message: "Invalid role",
      });
    }

    return callback(null, {
      statusCode: 200,
      message: "User Created",
    });
  }
  catch (error) {
    return callback(null, {
      statusCode: error.statusCode || 500,
      message: error.message || 'Error on adding users',
    });
  }
};

async function Create_User_Student(event) {
  const data = {
    TableName: "Users",
    Item: {
      user_id: `USER-${createUniqueID()}`,
      firstname: event.firstname,
      lastname: event.lastname,
      mobile: `91${event.mobile}`,
      userName: event.userName,
      password: event.password,
      dob: event.dob,
      batch_id: event.batch_id,
      batch_name: event.batch_name,
      year: event.year,
      academic_year: event.academic_year,
      gender: event.gender,
      address: event.address,
      pincode: event.pincode,
      state: event.state,
      city: event.city,
      nationality: event.nationality,
      area_name: event.area_name,
      aadhar_no: event.aadhar_no,
      religion: event.religion,
      community: event.community,
      caste: event.caste,
      father_name: event.father_name,
      mother_name: event.mother_name,
      parent_mobile: event.parent_mobile,
      registration_type: event.registration_type,
      sats_no: event.sats_no,
      status: event.status,
      course: event.course,
      created_by: event.created_by,
      remarks: event.remarks,
      user_role: event.user_role,
      institute_id: event.institute_id,
      branch_id: event.branch_id,
      admission_no: event.admission_no,
    },
  };

  return db.put(data).promise();
}

async function Create_User_Staff(event) {
  const data = {
    TableName: "Users",
    Item: {
      user_id: `USER-${createUniqueID()}`,
      firstname: event.firstname,
      lastname: event.lastname,
      dob: event.dob,
      mobile: `+91${event.mobile}`,
      userName: event.userName,
      password: event.password,
      department: event.department,
      designation: event.designation,
      gender: event.gender,
      blood_group: event.blood_group,
      spouse_name: event.spouse_name,
      father_name: event.father_name,
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
      user_role: event.user_role,
      institute_id: event.institute_id,
      branch_id: event.branch_id,
      status: event.status,
    },
  };


  return db.put(data).promise();
}

function createUniqueID() {
  const timestamp = new Date().getTime();
  const randomUUID = uuidv4().replace(/-/g, "");
  return `${timestamp}-${randomUUID}`;
}

const signUpUserInCognito = async (event) => {
  try {
    // Create users in Cognito
    await cognito.signUp({
      ClientId: '7k6a8mfavvsj2srjkqm828j5di',
      Password: event.password ,
      Username: event.userName,
      UserAttributes: [
        { Name: 'name', Value: `${event.firstname} ${event.lastname}` },
        { Name: 'email', Value: 'mailtest@gmail.com' },
        { Name: 'birthdate', Value: '10-08-1998' },
        { Name: 'phone_number', Value: `+91${event.mobile}` },
        { Name: 'custom:custom:role', Value: event.user_role },
      ],
    }).promise();
  }
  catch (error) {
    console.log('Cognito error', error);
    throw {
      statusCode: error.code === 'UsernameExistsException' ? 400 : 500,
      message: error.code === 'UsernameExistsException' ? error.message : 'Error on adding users to Cognito'
    };
  }
};

const validateInput = (event) => {
  try {
    let validationResult;

    if (event.user_role.toLowerCase() === "student") {
      validationResult = studentSchema.validate(event, { abortEarly: false });
    }
    else if (event.user_role.toLowerCase() === "staff" || event.user_role.toLowerCase() === "teacher") {
      validationResult = teacherSchema.validate(event, { abortEarly: false });
    }
    else {
      return {
        statusCode: 400,
        message: "Invalid role",
      };
    }
    
     const userNameRegex = /^[\p{L}\p{M}\p{S}\p{N}\p{P}]+$/u;
    if (!userNameRegex.test(event.userName)) {
      return {
        statusCode: 400,
        message: "Invalid username. Please use only letters, numbers, and common symbols",
      };
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(event.password)) {
      return {
        statusCode: 400,
        message: "Invalid password. Password must contain at least one lowercase letter, one uppercase letter, and one digit. Minimum length is 8 characters",
      };
    }

    if (validationResult.error) {
      return {
        statusCode: 400,
        message: validationResult.error.details[0].message,
      };
    }

    return {
      statusCode: 200,
    };
  }
  catch (error) {
    return {
      statusCode: 500,
      message: 'Internal server error during validation',
    };
  }
};
