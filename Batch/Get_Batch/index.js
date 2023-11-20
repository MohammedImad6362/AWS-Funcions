const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'ap-south-1' });
const Joi = require('joi');

exports.handler = async (event, context) => {
  try {
    const instituteId = event.pathParameters.institute_id;
    console.log("id", instituteId);

    const requestBody = JSON.parse(event.body);
    console.log("body", requestBody);

    const branchId = requestBody.branch_id;
    const batchId = requestBody.batch_id;

    // Add validation schema for batch attributes
    const batchSchema = Joi.object({
      branch_id: Joi.string().required(),
      batch_id: Joi.string().required()
    });

    const { error } = batchSchema.validate(requestBody);

    if (error) {
      return response({
        statusCode: 400,
        body: JSON.stringify({
          error: 'Bad Request',
          msg: error.details[0].message,
        }),
      });
    }

    const existingInstitute = await getInstituteData(instituteId);

    if (!existingInstitute) {
      return response({
        statusCode: 400,
        body: JSON.stringify({ msg: "Institute not found" })
      });
    }

    const branchIndex = existingInstitute.branches.findIndex(
      (branch) => branch.branch_id === branchId
    );

    if (branchIndex === -1) {
      return response({
        statusCode: 400,
        body: JSON.stringify({ msg: "Branch not found" })
      });
    }

    const batchIndex = existingInstitute.branches[branchIndex].batch.findIndex(
      (batch) => batch.id === batchId
    );

    if (batchIndex === -1) {
      return response({
        statusCode: 400,
        body: JSON.stringify({ msg: "Batch not found" })
      });
    }

    const allBatches = await getActiveBatches(existingInstitute.branches);

    return response({
      statusCode: 200,
      body: JSON.stringify({
        status_code: 200,
        activeBatches: allBatches,
      })
    });
  }
  catch (err) {
    console.log(err);
    return response({
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    });
  }
};

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

async function getActiveBatches(branches) {
  const activeBatches = [];

  branches.forEach((branch) => {
    branch.batch.forEach((batch) => {
      if (batch.status === 'ACTIVE') {
        activeBatches.push(batch);
      }
    });
  });

  return activeBatches;
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
