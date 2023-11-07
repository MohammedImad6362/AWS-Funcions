const AWS = require('aws-sdk');
const DynamoDB = new AWS.DynamoDB.DocumentClient({ region: 'ap-south-1' });
const Joi = require('joi');

exports.handler = async (event, context) => {
  try {
    const { institute_id, id } = event.pathParameters;

    const pathParamsSchema = Joi.object({
      institute_id: Joi.string().required(),
      id: Joi.string().required(),
    });

    const pathParamsValidation = pathParamsSchema.validate(event.pathParameters);

    if (pathParamsValidation.error) {
      return response({
        statusCode: 400,
        body: JSON.stringify({
          error: 'Bad Request',
          message: pathParamsValidation.error.details[0].message,
        }),
      });
    }

    const institute = await getInstitute(institute_id);

    if (!institute) {
      return response({
        statusCode: 404,
        body: JSON.stringify({
          error: 'Not Found',
          message: `Institute with ID ${institute_id} does not exist.`,
        })
      });
    }

    // Find the branch within the institute
    const branchIndex = institute.branches.findIndex(branch => branch.branch_id === id);

    if (branchIndex === -1) {
      return response({
        statusCode: 404,
        body: JSON.stringify({
          error: 'Not Found',
          message: `Branch with ID ${id} does not exist in the Institute.`,
        })
      });
    }

    institute.branches[branchIndex].status = 'INACTIVE';

    await updateInstitute(institute);

    return response({
      statusCode: 200,
      body: JSON.stringify({
        message: "Branch deactivated successfully",
        deactivatedBranch: institute.branches[branchIndex],
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

const getInstitute = async (institute_id) => {
  const params = {
    TableName: 'Institute',
    Key: {
      'institute_id': institute_id,
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
