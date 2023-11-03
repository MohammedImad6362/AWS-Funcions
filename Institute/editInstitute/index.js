const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'ap-south-1' });
const Joi = require('joi');

// Define a function to get an institute record by ID
const getInstitute = async (institute_id) => {
    const params = {
        TableName: 'Institute_UAT',
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
            address: Joi.string().optional(),
            area: Joi.string().optional(),
            branches: Joi.array().optional(),
            code: Joi.string().optional(),
            city: Joi.string().optional(),
            contact_no: Joi.string().optional(),
            course_ids: Joi.array().optional(),
            email: Joi.string().optional(),
            expiry_date: Joi.string().optional(),
            logo: Joi.string().optional(),
            institute_name: Joi.string().optional(),
            nonteacher_limit: Joi.string().optional(),
            pincode: Joi.string().optional(),
            question_limit: Joi.string().optional(),
            state: Joi.string().optional(),
            status: Joi.string().optional(),
            student_limit: Joi.string().optional(),
            teacher_limit: Joi.string().optional(),
            user_name: Joi.string().optional(),
            password: Joi.string().optional(),
            user_role: Joi.string().optional(),
        });

        const { error } = schema.validate(requestBody);

        if (error) {
            throw new Error(`Validation error: ${error.details[0].message}`);
        }

        // Check if the record with the provided institute_id exists
        const existingRecord = await getInstitute(institute_id);

        if (!existingRecord) {
            throw new Error(`Record with institute_id ${institute_id} does not exist.`);
        }

        const updatedItem = await updateInstitute(institute_id, requestBody);

        return response({
            statusCode: 200,
            body: JSON.stringify({
                message: "Institute updated successfully",
                updatedItem: updatedItem 
            })
        });
    } catch (err) {
        return response({
            statusCode: 500,
            body: JSON.stringify({ error: err.message })
        });
    }
};

const updateInstitute = async (institute_id, requestBody) => {
  // const updateParams = {
  //   TableName: "Institute_UAT",
  //   Key: {
  //     institute_id: institute_id, 
  //   },
  //   UpdateExpression: `SET #address = :address, #area = :area, #branches = :branches, #city = :city, #contact_no = :contact_no, #course_ids = :course_ids, #email = :email, #expiry_date = :expiry_date, #logo = :logo, #institute_name = :institute_name, #nonteacher_limit = :nonteacher_limit, #pincode = :pincode, #question_limit = :question_limit, #state = :state, #status = :status, #student_limit = :student_limit, #teacher_limit = :teacher_limit, #user_name = :user_name, #password = :password, #user_role = :user_role`,
  //   ExpressionAttributeNames: {
  //     '#address': 'address',
  //     '#area': 'area',
  //     '#branches': 'branches',
  //     '#city': 'city',
  //     '#contact_no': 'contact_no',
  //     '#course_ids': 'course_ids',
  //     '#email': 'email',
  //     '#expiry_date': 'expiry_date',
  //     '#logo': 'logo',
  //     '#institute_name': 'name',
  //     '#nonteacher_limit': 'nonteacher_limit',
  //     '#pincode': 'pincode',
  //     '#question_limit': 'question_limit',
  //     '#state': 'state',
  //     '#status': 'status',
  //     '#student_limit': 'student_limit',
  //     '#teacher_limit': 'teacher_limit',
  //     '#user_name': 'user_name',
  //     '#password': 'password',
  //     '#user_role': 'user_role',
  //   },
  //   ExpressionAttributeValues: {
  //     ':address': address || null,
  //     ':area': area || null,
  //     ':branches': branches || null,
  //     ':city': city || null,
  //     ':contact_no': contact_no || null,
  //     ':course_ids': course_ids || null,
  //     ':email': email || null,
  //     ':expiry_date': expiry_date || null,
  //     ':logo': logo || null,
  //     ':institute_name': institute_name || null,
  //     ':nonteacher_limit': nonteacher_limit || null,
  //     ':pincode': pincode || null,
  //     ':question_limit': question_limit || null,
  //     ':state': state || null,
  //     ':status': status || null,
  //     ':student_limit': student_limit || null,
  //     ':teacher_limit': teacher_limit || null,
  //     ':user_name': user_name || null,
  //     ':password': password || null,
  //     ':user_role': user_role || null,
  //   },
  // };
    const updateExpressionParts = [];
    const expressionAttributeValues = {};

    if (requestBody.address) {
        updateExpressionParts.push('set address = :address');
        expressionAttributeValues[':address'] = requestBody.address;
    }

    if (requestBody.area) {
        updateExpressionParts.push('set area = :area');
        expressionAttributeValues[':area'] = requestBody.area;
    }

    if (requestBody.branches) {
        updateExpressionParts.push('set branches = :branches');
        expressionAttributeValues[':branches'] = requestBody.branches;
    }

    if (requestBody.code) {
        updateExpressionParts.push('set code = :code');
        expressionAttributeValues[':code'] = requestBody.code;
    }

    if (requestBody.city) {
        updateExpressionParts.push('set city = :city');
        expressionAttributeValues[':city'] = requestBody.city;
    }

    if (requestBody.contact_no) {
        updateExpressionParts.push('set contact_no = :contact_no');
        expressionAttributeValues[':contact_no'] = requestBody.contact_no;
    }

    if (requestBody.course_ids) {
        updateExpressionParts.push('set course_ids = :course_ids');
        expressionAttributeValues[':course_ids'] = requestBody.course_ids;
    }

    if (requestBody.email) {
        updateExpressionParts.push('set email = :email');
        expressionAttributeValues[':email'] = requestBody.email;
    }

    if (requestBody.expiry_date) {
        updateExpressionParts.push('set expiry_date = :expiry_date');
        expressionAttributeValues[':expiry_date'] = requestBody.expiry_date;
    }

    if (requestBody.logo) {
        updateExpressionParts.push('set logo = :logo');
        expressionAttributeValues[':logo'] = requestBody.logo;
    }

    if (requestBody.institute_name) {
        updateExpressionParts.push('set name = :name');
        expressionAttributeValues[':name'] = requestBody.institute_name;
    }

    if (requestBody.nonteacher_limit) {
        updateExpressionParts.push('set nonteacher_limit = :nonteacher_limit');
        expressionAttributeValues[':nonteacher_limit'] = requestBody.nonteacher_limit;
    }

    if (requestBody.pincode) {
        updateExpressionParts.push('set pincode = :pincode');
        expressionAttributeValues[':pincode'] = requestBody.pincode;
    }

    if (requestBody.question_limit) {
        updateExpressionParts.push('set question_limit = :question_limit');
        expressionAttributeValues[':question_limit'] = requestBody.question_limit;
    }

    if (requestBody.state) {
        updateExpressionParts.push('set state = :state');
        expressionAttributeValues[':state'] = requestBody.state;
    }

    if (requestBody.status) {
        updateExpressionParts.push('set status = :status');
        expressionAttributeValues[':status'] = requestBody.status;
    }

    if (requestBody.student_limit) {
        updateExpressionParts.push('set student_limit = :student_limit');
        expressionAttributeValues[':student_limit'] = requestBody.student_limit;
    }

    if (requestBody.teacher_limit) {
        updateExpressionParts.push('set teacher_limit = :teacher_limit');
        expressionAttributeValues[':teacher_limit'] = requestBody.teacher_limit;
    }

    if (requestBody.user_name) {
        updateExpressionParts.push('set user_name = :user_name');
        expressionAttributeValues[':user_name'] = requestBody.user_name;
    }

    if (requestBody.password) {
        updateExpressionParts.push('set password = :password');
        expressionAttributeValues[':password'] = requestBody.password;
    }

    if (requestBody.user_role) {
        updateExpressionParts.push('set user_role = :user_role');
        expressionAttributeValues[':user_role'] = requestBody.user_role;
    }

    if (updateExpressionParts.length === 0) {
        throw new Error("No valid fields provided for update.");
    }

    const updateExpression = updateExpressionParts.join(', ');

    const params = {
        TableName: 'Institute_UAT',
        Key: {
            'institute_id': institute_id
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW"
    };

    return dynamodb.update(params).promise();
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
