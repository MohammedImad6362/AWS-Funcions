const AWS = require('aws-sdk');
const DynamoDB = new AWS.DynamoDB.DocumentClient({ region: 'ap-south-1' });

exports.handler = async (event, context, callback) => {
  const testNameId = event.test_name_id;

  try {
    const testName = await getTestName(testNameId);

    if (!testName) {
      return {
        statusCode: 400,
        response: "TestName not found"
      };
    }

    return {
      statusCode: 200,
      response: testName.Items
    };
  }
  catch (err) {
    return {
      statusCode: 500,
      error: {
        msg: "Internal server error",
        error: err.message
      }
    };
  }
};

let getTestName = async (testNameId) => {
  const params = {
    TableName: 'Test-Name-Testing',
    KeyConditionExpression: 'test_name_id = :testNameId',
    ExpressionAttributeValues: {
      ':testNameId': testNameId
    }
  };
  return DynamoDB.query(params).promise();
};
