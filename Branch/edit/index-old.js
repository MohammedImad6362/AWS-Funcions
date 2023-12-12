const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'ap-south-1' });
const Joi = require('joi');
const { v4: uuidv4 } = require("uuid");

const getInstituteData = async (instituteId) => {
  const params = {
    TableName: 'Institute',
    Key: {
      'institute_id': instituteId
    }
  };

  const result = await dynamodb.get(params).promise();

  return result.Item;
};

exports.handler = async (event, context) => {
  try {
    const instituteId = event.pathParameters.institute_id;
    const branchId = event.pathParameters.id;
    const requestBody = JSON.parse(event.body);

    const schema = Joi.object({
      name: Joi.string().allow(''),
      contact_no: Joi.string().pattern(/^\d{10}$/).allow(''),
      email: Joi.string().email().allow(''),
      address: Joi.string().allow(''),
      pincode: Joi.string().pattern(/^\d{6}$/).allow(''),
      area: Joi.string().allow(''),
      city: Joi.string().allow(''),
      state: Joi.string().allow(''),
      course_ids: Joi.array().items(Joi.string()),
      expiry_date: Joi.date().iso().allow(null),
      student_limit: Joi.number().integer().allow(null),
      teacher_limit: Joi.number().integer().allow(null),
      nonteacher_limit: Joi.number().integer().allow(null),
      question_limit: Joi.number().integer().allow(null),
      password: Joi.string().allow(''),
      status: Joi.string().allow(''),
      code: Joi.string().allow(''),
      batch: Joi.array().items(),
      batch_student_limit: Joi.number().integer().allow('')
    });

    const { error } = schema.validate(requestBody);

    if (error) {
      return response({
        body: JSON.stringify({
          statusCode: 400,
          message: error.details[0].message
        })
      });
    }

    const existingInstitute = await getInstituteData(instituteId);

    if (!existingInstitute) {
      return response({
        body: JSON.stringify({
          statusCode: 400,
          message: "Institute not found"
        })
      });
    }

    const branchIndex = existingInstitute.branches.findIndex(
      (branch) => branch.branch_id === branchId
    );

    if (branchIndex === -1) {
      return response({
        body: JSON.stringify({
          statusCode: 400,
          message: "Branch not found"
        })
      });
    }

    const exceededMessages = [];

    const checkLimit = (limitType, bodyValue, instituteValue) => {
      if (parseInt(bodyValue) > parseInt(instituteValue)) {
        exceededMessages.push(`${limitType} exceeded ${instituteValue}`);
      }
    };

    checkLimit("student_limit", requestBody.student_limit, existingInstitute.branch_student_limit);
    checkLimit("teacher_limit", requestBody.teacher_limit, existingInstitute.branch_teacher_limit);
    checkLimit("nonteacher_limit", requestBody.nonteacher_limit, existingInstitute.branch_nonteacher_limit);

    const branch_student_limit = existingInstitute.branch_student_limit;
    const branch_teacher_limit = existingInstitute.branch_teacher_limit;
    const branch_nonteacher_limit = existingInstitute.branch_nonteacher_limit;

    if (exceededMessages.length > 0) {
      return response({
        statusCode: 400,
        body: JSON.stringify({
          message: exceededMessages[0]
        })
      });
    }

    if (requestBody.email) {
      const { email, password } = requestBody;
      delete requestBody.password;

      const userData = {
        email,
        entities_connected_with: [{
          entity_name: requestBody.name,
          branch_id: branchId,
          institute_id: instituteId,
          role: "BRANCH",
        }],
      };

      if (password) {
        userData.password = password;
      }
      requestBody.institute_id = instituteId;
      requestBody.branch_id = branchId;

      const { emailExists, user } = await checkEmailExists(email);
      if (emailExists) {
        console.log('emailExists');
        await updateBranchWithAdmin(
          requestBody, {
            user_id: user.user_id,
            entities_connected_with: userData.entities_connected_with,
          },
          true
        );
      }
      else {
        await updateBranchWithAdmin(requestBody, userData);
      }
    }
    else {
      // Call updateBranch without email
      await updateBranch(instituteId, branchId, requestBody);
    }

    return response({
      body: JSON.stringify({
        statusCode: 200,
        message: 'Branch Updated',
      }),
    })
  }
  catch (error) {
    console.log('Error', error);
    return response({
      body: JSON.stringify({
        statusCode: 400,
        message: error.message,
      }),
    });
  }
};

async function updateBranchWithAdmin(data, userData, userUpdate) {
  const branchData = [data];
  data.batch = [];

  const instituteData = await getInstituteData(data.institute_id);
  const branchIndex = instituteData.branches.findIndex(
    (branch) => branch.branch_id === data.branch_id
  );

  const updatedData = { ...instituteData.branches[branchIndex], ...data };
  instituteData.branches[branchIndex] = updatedData;

  const params = {
    TransactItems: [
      userUpdate ? {
        Update: {
          TableName: 'Users',
          Key: {
            user_id: userData.user_id,
          },
          UpdateExpression: 'SET #attrName = list_append(#attrName, :attrValue)',
          ExpressionAttributeNames: {
            '#attrName': 'entities_connected_with',
          },
          ExpressionAttributeValues: {
            ':attrValue': userData.entities_connected_with,
          },
          ReturnValues: 'ALL_NEW',
        },
      } : {
        Put: {
          TableName: 'Users',
          Item: {
            user_id: `USER-${createUniqueID()}`,
            ...userData,
          },
        },
      },
      {
        Update: {
          TableName: 'Institute',
          Key: {
            institute_id: data.institute_id,
          },
          UpdateExpression: 'SET #attrName = :attrValue',
          ExpressionAttributeNames: {
            '#attrName': 'branches',
          },
          ExpressionAttributeValues: {
            ':attrValue': instituteData.branches,
          },
          ReturnValues: 'ALL_NEW',
        },
      },
    ],
  };

  try {
    const result = await dynamodb.transactWrite(params).promise();
  }
  catch (error) {
    console.error('TransactWrite error:', error);

    if (error.code === 'TransactionCanceledException') {
      console.error('Cancellation Reasons:', error.cancellationReasons);
    }

    throw error;
  }
}

async function updateBranch(instituteId, branchId, requestBody) {
  const instituteData = await getInstituteData(instituteId);
  const branchIndex = instituteData.branches.findIndex(
    (branch) => branch.branch_id === branchId
  );

  const updatedData = { ...instituteData.branches[branchIndex], ...requestBody };
  instituteData.branches[branchIndex] = updatedData;

  const params = {
    TableName: 'Institute',
    Key: {
      'institute_id': instituteId
    },
    UpdateExpression: 'SET #branches = :branches',
    ExpressionAttributeNames: {
      '#branches': 'branches'
    },
    ExpressionAttributeValues: {
      ':branches': instituteData.branches,
    },
    ReturnValues: "ALL_NEW"
  };

  await dynamodb.update(params).promise();
}

const checkEmailExists = async (email) => {
  const params = {
    TableName: "Users",
    IndexName: "email-index",
    KeyConditionExpression: "email = :email",
    ExpressionAttributeValues: {
      ":email": email,
    },
  };

  try {
    const data = await dynamodb.query(params).promise();
    return {
      emailExists: data.Items.length > 0,
      user: data.Items && data.Items[0],
    };
  }
  catch (error) {
    console.error("Error:", error);
    throw error;
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

function createUniqueID() {
  const timestamp = new Date().getTime();
  const randomUUID = uuidv4().replace(/-/g, "");
  return `${timestamp}-${randomUUID}`;
}
