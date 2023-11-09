const AWS = require('aws-sdk');
const DynamoDB = new AWS.DynamoDB.DocumentClient({ region: 'ap-south-1' });
const Joi = require('joi');

exports.handler = async (event, context) => {
  try {
    const  instituteId  = event.pathParameters.institute_id;
    
    const reqBody = JSON.parse(event.body)
    const branchId = reqBody.branch_id
    const batchId = reqBody.batch_id

     // Add validation schema for batch attributes
    const batchSchema = Joi.object({
      branch_id: Joi.string().required(),
      batch_id: Joi.string().required()
    });

    const { error } = batchSchema.validate(reqBody);

    if (error) {
      return response({
        statusCode: 400,
        body: JSON.stringify({
          error: 'Bad Request',
          msg: error.details[0].message,
        }),
      });
    }
    const institute = await getInstitute(instituteId);

    if (!institute) {
      return response({
        statusCode: 404,
        body: JSON.stringify({
          message: `Institute with ID ${instituteId} does not exist.`,
        })
      });
    }

    // Find the branch within the institute
    const branchIndex = institute.branches.findIndex(branch => branch.branch_id === branchId);

    if (branchIndex === -1) {
      return response({
        statusCode: 404,
        body: JSON.stringify({
          message: `Branch with ID ${branchId} does not exist in the Institute.`,
        })
      });
    }
    
    const batchIndex = institute.branches[branchIndex].batch.findIndex(
      (batch) => batch.id === batchId
    );

    if (batchIndex === -1) {
      return response({
        statusCode: 404,
        body: JSON.stringify({
          message: `Batch with ID ${batchId} does not exist.`,
        })
      });
    }

    institute.branches[branchIndex].batch[batchIndex].status = 'INACTIVE';

    await updateInstitute(institute);

    return response({
      statusCode: 200,
      body: JSON.stringify({
        message: "Batch deactivated successfully",
        deactivatedBatch: institute.branches[branchIndex].batch[batchIndex],
      })
    });
  } catch (err) {
    console.log("Error:", err);
    return response({
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        msg: err.message,
      })
    });
  }
};

const getInstitute = async (instituteId) => {
  const params = {
    TableName: 'Institute',
    Key: {
      'institute_id': instituteId,
    },
  };
  const result = await DynamoDB.get(params).promise();

  if (result.Item) {
    return result.Item;
  }

  return null;
};

const updateInstitute = async (institute) => {
  const params = {
    TableName: 'Institute',
    Key: {
      'institute_id': institute.institute_id,
    },
    UpdateExpression: 'SET branches = :branches',
    ExpressionAttributeValues: {
      ':branches': institute.branches,
    },
  };
  await DynamoDB.update(params).promise();
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
