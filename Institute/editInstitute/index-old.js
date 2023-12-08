const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'ap-south-1' });
const Joi = require('joi');

const getInstitute = async (institute_id) => {
    const params = {
        TableName: 'Institute',
        Key: {
            'institute_id': institute_id
        }
    };

    const result = await dynamodb.get(params).promise();

    return result.Item;
};

exports.handler = async (event, context) => {
    try {
        const institute_id = event.pathParameters.id;

        const requestBody = JSON.parse(event.body);

        const schema = Joi.object({
            address: Joi.string().allow(''),
            area: Joi.string().allow(''),
            branches: Joi.array(),
            code: Joi.string().allow(''),
            city: Joi.string().allow(''),
            contact_no: Joi.string().pattern(/^\d{10}$/).allow(''),
            country: Joi.string().allow(''),
            course_ids: Joi.array().items(Joi.string()).allow(''),
            email: Joi.string().email().allow(''),
            expiry_date: Joi.date().iso().allow(''),
            logo: Joi.string().allow(''),
            name: Joi.string().required().allow(''),
            nonteacher_limit: Joi.number().integer().allow(''),
            pincode: Joi.string().pattern(/^\d{6}$/).allow(''),
            state: Joi.string().allow(''),
            status: Joi.string().allow(''),
            student_limit: Joi.number().integer().allow(''),
            teacher_limit: Joi.number().integer().allow(''),
            user_name: Joi.string().allow(''),
            password: Joi.string().allow(''),
            user_role: Joi.string().allow(''),
        });

        const { error } = schema.validate(requestBody);

        if (error) {
            throw new Error(`Validation error: ${error.details[0].message}`);
        }

        const existingRecord = await getInstitute(institute_id);

        if (!existingRecord) {
            throw new Error(`Record with institute_id ${institute_id} does not exist.`);
        }

        const updateExpressionParts = [];
        const expressionAttributeValues = {};
        const expressionAttributeNames = {};

        for (const key in requestBody) {
            if (requestBody[key] !== undefined) {
                const attributeName = `#${key}`;
                const attributeValue = `:${key}`;

                updateExpressionParts.push(`${attributeName} = ${attributeValue}`);
                expressionAttributeNames[attributeName] = key;
                expressionAttributeValues[attributeValue] = requestBody[key];
            }
        }

        if (updateExpressionParts.length === 0) {
            throw new Error("No valid fields provided for update.");
        }

        const updateExpression = 'SET ' + updateExpressionParts.join(', ');

        const params = {
            TableName: 'Institute',
            Key: {
                'institute_id': institute_id
            },
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: "ALL_NEW"
        };

        // Update the item in DynamoDB
        const updatedItem = await dynamodb.update(params).promise();

        return response({
            statusCode: 200,
            body: JSON.stringify({
                message: "Institute updated successfully",
                updatedItem: updatedItem,
                status_code: 200
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
