const AWS = require('aws-sdk');
const DynamoDB = new AWS.DynamoDB.DocumentClient({ region: 'ap-south-1' });
const Joi = require('joi');

exports.handler = async (event, context) => {
  console.log("event", JSON.stringify(event, null, 2));

  try {
    const test_name_id = event.pathParameters.id;

    // Define a Joi schema for validating the path parameter
    const pathParamsSchema = Joi.object({
      id: Joi.string().required(),
    });

    // Validate the path parameter against the schema
    const pathParamsValidation = pathParamsSchema.validate(event.pathParameters);

    if (pathParamsValidation.error) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Bad Request',
          message: pathParamsValidation.error.details[0].message,
        }),
      };
    }

    const testName = await getTestName(test_name_id);

    if (!testName) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'Not Found',
          message: (`TestName not found for the provided test_name_id ${test_name_id}`),
        }),
      };
    }

    await deleteTestName(test_name_id);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "TestName deleted successfully.",
        deletedItem: testName}),
    }
  }
  catch (err) {
    console.log("Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        msg: err.message,
      }),
    };
  }
};

const getTestName = async (test_name_id) => {
  const params = {
    TableName: 'Test_Name',
    Key: {
      'test_name_id': test_name_id,
    },
  };
  const result = await DynamoDB.get(params).promise();

  if (result.Item) {
    return result.Item;
  }

  return null;
};

const deleteTestName = async (test_name_id) => {
  const params = {
    TableName: 'Test_Name',
    Key: {
      'test_name_id': test_name_id,
    },
  };
  await DynamoDB.delete(params).promise();
};
