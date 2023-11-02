const AWS = require('aws-sdk');
const DynamoDB = new AWS.DynamoDB.DocumentClient({ region: 'ap-south-1' });
const Joi = require('joi');

exports.handler = async (event, context) => {
  try {
    const schema = Joi.object({
      test_name_id: Joi.string().required(),
      test_name: Joi.string().required(),
      test_name_description: Joi.string(),
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

    await createTestName(event);
    return {
      statusCode: 200,
      body: {
        msg: 'Test name created successfully...!',
      },
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: {
        error: 'Internal server error',
        msg: err.message,
      },
    };
  }
};

const createTestName = async (event) => {
  let date = new Date();
  const params = {
    TableName: 'Test-Name-Testing',
    Item: {
      'test_name_id': event.test_name_id,
      'test_name': event.test_name,
      'test_name_description': event.test_name_description,
      'updated_at': date.toISOString(),
      'created_at': date.toISOString(),
    },
  };

  return DynamoDB.put(params).promise();
};
