const AWS = require('aws-sdk');
const DynamoDB = new AWS.DynamoDB.DocumentClient({ region: 'ap-south-1' });
const Joi = require('joi');

exports.handler = async (event, context) => {
  try {
    const institute_id = event.pathParameters.id;

    const pathParamsSchema = Joi.object({
      id: Joi.string().required(),
    });

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

    const existingRecord = await getInstitute(institute_id);

    if (!existingRecord) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'Not Found',
          message: `Record with institute_id ${institute_id} does not exist.`,
        })
      }
    }

    // Deactivate the record by setting the "status" field to "inactive"
    existingRecord.status = 'inactive';
    await updateInstitute(existingRecord);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Institute deactivated successfully",
        deactivatedItem: existingRecord,
      })
    }
  } catch (err) {
    console.log("Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        msg: err.message,
      })
    }
  }
};

const getInstitute = async (institute_id) => {
  const params = {
    TableName: 'Institute_UAT',
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
    TableName: 'Institute_UAT',
    Key: {
      'institute_id': institute.institute_id,
    },
    UpdateExpression: 'SET #status = :status',
    ExpressionAttributeNames: {
      '#status': 'status',
    },
    ExpressionAttributeValues: {
      ':status': institute.status,
    },
  };
  await DynamoDB.update(params).promise();
};
