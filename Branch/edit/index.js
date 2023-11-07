const AWS = require("aws-sdk");
const Joi = require("joi");

const db = new AWS.DynamoDB.DocumentClient({ region: "ap-south-1" });

exports.editBranch = async (event) => {
  try {
    const { error } = editBranchSchema.validate(event);
    if (error) {
      console.error("Validation error:", error.details[0].message);
      return response({
        statusCode: 400,
        body: error.details[0].message,
      });
    }
    const instituteId = event.pathParameters.institute_id;
    const branchId = event.pathParameters.branch_id;

    // Retrieve the existing institute data
    const existingInstitute = await getInstituteData(instituteId);
    console.log("InstData", existingInstitute);

    if (!existingInstitute) {
      return response({
        statusCode: 404,
        body: "Institute not found",
      });
    }

    // Find the branch within the institute by branch_id
    const branchIndex = existingInstitute.branches.findIndex(
      (branch) => branch.branch_id === branchId
    );
    console.log("branch", branchIndex);

    if (branchIndex === -1) {
      return response({
        statusCode: 404,
        body: "Branch not found",
      });
    }

    const updatedData = {
      name: event.body.name,
      logo: event.body.logo,
      contact_no: event.body.contact_no,
      address: event.body.address,
      email: event.body.email,
      pincode: event.body.pincode,
      area: event.body.area,
      city: event.body.city,
      state: event.body.state,
      course_ids: event.body.course_ids,
      expiry_date: event.body.expiry_date,
      student_limit: event.body.student_limit,
      teacher_limit: event.body.teacher_limit,
      nonteacher_limit: event.body.nonteacher_limit,
      question_limit: event.body.question_limit,
      password: event.body.password,
      status: event.body.status,
    };

    // Merge the updated data with the existing branch data
    const updatedBranch = { ...existingInstitute.branches[branchIndex], ...updatedData };

    // Update the branch within the institute
    existingInstitute.branches[branchIndex] = updatedBranch;

    // Update the institute in DynamoDB
    await updateInstituteData(instituteId, existingInstitute);

    return JSON.stringify(response({
      statusCode: 200,
      body: "Branch updated",
    }));
  }
  catch (error) {
    console.log("Error", error);
    return response({
      statusCode: 400,
      body: error.message,
    });
  }
};

async function getInstituteData(instituteId) {
  const params = {
    TableName: "Institute",
    Key: {
      institute_id: instituteId,
    },
  };

  try {
    const data = await db.get(params).promise();
    return data.Item; 
  }
  catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function updateInstituteData(instituteId, updatedData) {
  const params = {
    TableName: "Institute", 
    Key: {
      institute_id: instituteId,
    },
    UpdateExpression: "SET #branches = :branches",
    ExpressionAttributeNames: {
      "#branches": "branches",
    },
    ExpressionAttributeValues: {
      ":branches": updatedData.branches,
    },
    ReturnValues: "ALL_NEW",
  };

  try {
    await db.update(params).promise();
  }
  catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

const editBranchSchema = Joi.object({
  name: Joi.string(),
  logo: Joi.string(),
  contact_no: Joi.string()
    .pattern(/^\d{10}$/), 
  email: Joi.string().email(),
  address: Joi.string(),
  pincode: Joi.string()
    .pattern(/^\d{6}$/), 
  area: Joi.string(),
  city: Joi.string(),
  state: Joi.string(),
  course_ids: Joi.array().items(Joi.string()),
  expiry_date: Joi.date().iso(),
  student_limit: Joi.number().integer(),
  teacher_limit: Joi.number().integer(),
  nonteacher_limit: Joi.number().integer(),
  question_limit: Joi.number().integer(),
  password: Joi.string(),
  status: Joi.string()
});

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