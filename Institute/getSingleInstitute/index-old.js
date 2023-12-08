const AWS = require('aws-sdk');
const DynamoDB = new AWS.DynamoDB.DocumentClient({ region: 'ap-south-1' });

exports.handler = async (event, context, callback) => {
  try {
    const institute_id = event.pathParameters.id;

    const institute = await getActiveInstitute(institute_id);

    if (institute) {
      return response({
        statusCode: 200,
        body: JSON.stringify(institute),
      });
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'Not Found',
          msg: `Active institute with institute_id ${institute_id} not found.`,
        }),
      };
    }
  } catch (err) {
    return response({
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        msg: err.message,
      }),
    });
  }
};

async function getActiveInstitute(institute_id) {
  const params = {
    TableName: 'Institute',
    Key: {
      'institute_id': institute_id,
    },
  };

  const result = await DynamoDB.get(params).promise();

  const institute = result.Item;
  if (institute && institute.status === 'ACTIVE') {
    return institute;
  }

  return null;
}

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