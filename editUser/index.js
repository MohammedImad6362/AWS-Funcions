const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient({ region: "ap-south-1" });
const cognito = new AWS.CognitoIdentityServiceProvider();
const { studentSchema, teacherSchema } = require('./validation.js');

exports.handler = async (event, context, callback) => {
  try {
    const validationResult = validateInput(event);
    if (validationResult.statusCode !== 200) {
      return validationResult;
    }

    // Update user in Cognito
    await updateCognitoUser(event);

    // Update user in DynamoDB
    if (event.user_role.toLowerCase() === "student") {
      await updateStudentUser(event);
    }
    else if (event.user_role.toLowerCase() === "staff" || event.user_role.toLowerCase() === "teacher") {
      await updateStaffUser(event);
    }
    else {
      return callback(null, {
        statusCode: 400,
        message: "Invalid role",
      });
    }

    return callback(null, {
      statusCode: 200,
      message: "User Updated",
    });
  }
  catch (error) {
    return callback(null, {
      statusCode: error.statusCode || 500,
      message: error.message || 'Error on updating users',
    });
  }
};

async function updateStudentUser(event) {
  const updateExpressionParts = [];
  const expressionAttributeValues = {};
  const expressionAttributeNames = {};

  for (const key in event) {
    if (event[key] !== undefined) {
      const attributeName = `#${key}`;
      const attributeValue = `:${key}`;

      updateExpressionParts.push(`${attributeName} = ${attributeValue}`);
      expressionAttributeNames[attributeName] = key;
      expressionAttributeValues[attributeValue] = event[key];
    }
  }

  if (updateExpressionParts.length === 0) {
    throw new Error("No valid fields provided for update.");
  }

  const updateExpression = 'SET ' + updateExpressionParts.join(', ');

  const params = {
    TableName: 'Users',
    Key: {
      'user_id': event.user_id,
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "ALL_NEW"
  };

  return db.update(params).promise();
}

async function updateStaffUser(event) {
   const updateExpressionParts = [];
  const expressionAttributeValues = {};
  const expressionAttributeNames = {};

  for (const key in event) {
    if (event[key] !== undefined) {
      const attributeName = `#${key}`;
      const attributeValue = `:${key}`;

      updateExpressionParts.push(`${attributeName} = ${attributeValue}`);
      expressionAttributeNames[attributeName] = key;
      expressionAttributeValues[attributeValue] = event[key];
    }
  }

  if (updateExpressionParts.length === 0) {
    throw new Error("No valid fields provided for update.");
  }

  const updateExpression = 'SET ' + updateExpressionParts.join(', ');

  const params = {
    TableName: 'Users',
    Key: {
      'user_id': event.user_id,
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "ALL_NEW"
  };

  return db.update(params).promise();
}

async function updateCognitoUser(event) {
  try {
    // Assuming user_id is the unique identifier in Cognito
    const userAttributes = [
      { Name: 'name', Value: `${event.firstname} ${event.lastname}` },
        { Name: 'email', Value: 'mailtest@gmail.com' },
        { Name: 'birthdate', Value: '10-08-1998' },
        { Name: 'phone_number', Value: `+91${event.mobile}` },
        { Name: 'custom:custom:role', Value: event.user_role },
    ];

    await cognito.adminUpdateUserAttributes({
      UserAttributes: userAttributes,
      UserPoolId: '7k6a8mfavvsj2srjkqm828j5di',
      Username: event.userName,
    }).promise();
  }
  catch (error) {
    console.log('Cognito update error', error);
    throw {
      statusCode: 500,
      message: 'Error on updating user in Cognito',
    };
  }
}

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
