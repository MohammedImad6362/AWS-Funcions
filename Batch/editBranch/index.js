const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'ap-south-1' });
const Joi = require('joi');

exports.handler = async (event, context) => {
  try {
    const instituteId = event.pathParameters.institute_id;
    const branchId = event.pathParameters.branch_id;
    const batchId = event.pathParameters.batch_id;

    const requestBody = event.body;

    // Add validation schema for batch attributes
    const batchSchema = Joi.object({
      name: Joi.string().allow(''),
      start_date: Joi.date().iso().allow(null),
      end_date: Joi.date().iso().allow(null),
      start_time: Joi.string().allow(''),
      end_time: Joi.string().allow(''),
      status: Joi.string().valid("ACTIVE", "INACTIVE").allow(''),
      student_limit: Joi.number().integer().allow(null),
      course_ids: Joi.array().items(Joi.string()).allow(null),
    });

    const { error } = batchSchema.validate(requestBody);

    if (error) {
      return {
        statusCode: 400,
        body: {
          error: 'Bad Request',
          msg: error.details[0].message,
        },
      };
    }

    const existingInstitute = await getInstituteData(instituteId);

    if (!existingInstitute) {
      return response({
        statusCode: 400,
        body: JSON.stringify({ msg: "Institute not found" })
      })
    }

    const branchIndex = existingInstitute.branches.findIndex(
      (branch) => branch.branch_id === branchId
    );

    if (branchIndex === -1) {
      return response({
        statusCode: 400,
        body: JSON.stringify({ msg: "Branch not found" })
      })
    }

    const batchIndex = existingInstitute.branches[branchIndex].batch.findIndex(
      (batch) => batch.batch_id === batchId
    );

    if (batchIndex === -1) {
      return response({
        statusCode: 400,
        body: JSON.stringify({ msg: "Batch not found" })
      })
    }

    // Merge the updated batch data with the existing batch
    const updatedBatch = { ...existingInstitute.branches[branchIndex].batch[batchIndex], ...requestBody };

    // Update the batch within the branch
    existingInstitute.branches[branchIndex].batch[batchIndex] = updatedBatch;

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
        ':branches': existingInstitute.branches
      },
      ReturnValues: "ALL_NEW"
    };

    await dynamodb.update(params).promise();

    return response({
      statusCode: 200,
      body: JSON.stringify({
        status_code: 200,
        message: "Batch updated successfully",
        updatedBatch: updatedBatch,
      })
    });
  }
  catch (err) {
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
