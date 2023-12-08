const AWS = require('aws-sdk');
const DynamoDB = new AWS.DynamoDB.DocumentClient({ region: 'ap-south-1' });

exports.handler = async (event, context, callback) => {
  try {
    const activeInstitutes = await getActiveInstitutes();

    return {
      status_code: 200,
      response: activeInstitutes,
    };
  }
  catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        msg: err.message,
      }),
    };
  }
};

async function getActiveInstitutes() {
  const params = {
    TableName: 'Institute',
    FilterExpression: '#status = :activeStatus',
    ExpressionAttributeNames: {
      '#status': 'status',
    },
    ExpressionAttributeValues: {
      ':activeStatus': 'ACTIVE',
    },
  };

  const result = await DynamoDB.scan(params).promise();

  return result;
}
