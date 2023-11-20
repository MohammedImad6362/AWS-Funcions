const AWS = require("aws-sdk");
const s3 = new AWS.S3({ region: "ap-south-1" });
const db = new AWS.DynamoDB.DocumentClient({ region: "ap-south-1" });
const { v4: uuidv4 } = require("uuid");
const Joi = require("joi");

exports.handler = async (event, context, callback) => {
	const validationSchema = Joi.object({
		institute_id: Joi.string().required(),
		branch_id: Joi.string().required(),
		name: Joi.string().required(),
		start_date: Joi.date().iso().required(),
		end_date: Joi.date().iso().required(),
		start_time: Joi.string().required(),
		end_time: Joi.string().required(),
		status: Joi.string().valid("ACTIVE", "INACTIVE").required(),
		student_limit: Joi.number().integer().required(),
		course_ids: Joi.array().items(Joi.string()).allow(null),
	});

	const { error } = validationSchema.validate(event);

	if (error) {
		return callback(null, {
			status_code: 400,
			response: error.details.map((err) => err.message).join(", "),
			error: error,
		});
	}

	let instituteData = await getInstituteData(event.institute_id)
	// console.log("instData",instituteData)
	instituteData = instituteData.Item
	if (!instituteData) {
		return {
			statusCode: 404,
			response: "Institute not found",
		};
	}

	const exceededLimits = [];

	const checkLimit = (limitType, bodyValue, instituteValue) => {
		if (parseInt(bodyValue) > parseInt(instituteValue)) {
			exceededLimits.push(limitType);
		}
	};

	checkLimit("student_limit", event.student_limit, instituteData.branches[0].batch_student_limit);

	const batch_student_limit = instituteData.branches[0].batch_student_limit
	if (exceededLimits.length > 0) {
		return {
			statusCode: 400,
			response: `${exceededLimits} exceeded ${batch_student_limit}`,
		};
	}

	var data_modified = [];

	await GetInstitute(event)
		.then(async (data) => {
			data.Items[0].branches.forEach((loop_data) => {
				if (event.branch_id === loop_data.branch_id) {
					loop_data.batch.push({...event, id: `BA-${createUniqueID()}`});
					data_modified.push(loop_data);
				} else {
					data_modified.push(loop_data);
				}
			});

			// console.log(data_modified);

			await Put_Batch(event, data_modified)
				.then(() => {
					return callback(null, {
						status_code: 200,
						response: "Batch Inserted",
					});
				})
				.catch((err) => {
					return callback(null, {
						status_code: 400,
						response: err,
					});
				});
		})
		.catch((error) => {
			console.log("err",error)
			return callback(null, {
				status_code: 400,
				response: error,
				msg: error.message
			});
		});
};
async function GetInstitute(event) {
	const data = {
		TableName: "Institute",
		FilterExpression: "institute_id = :institute_id",
		ExpressionAttributeValues: {
			":institute_id": event.institute_id, // event.Institute_id
		},
	};

	var result = await db.scan(data).promise();
	return result;
}

//for getting data with branches
async function getInstituteData(instituteID){
	const params = {
	  TableName: "Institute",
	  Key: {
		institute_id: instituteID
	  }
	}
	
	return db.get(params).promise()
  }

function Put_Batch(event, data_modified) {
	var i = 0;

	const params = {
		TableName: "Institute",
		Key: {
			institute_id: event.institute_id,
		},
		UpdateExpression: "SET #attrName =  :attrValue",
		ExpressionAttributeNames: {
			"#attrName": "branches",
		},
		ExpressionAttributeValues: {
			":attrValue": data_modified,
		},
		ReturnValues: "UPDATED_NEW",
	};

	return db.update(params).promise();
}

function createUniqueID() {
	const timestamp = new Date().getTime();
	const randomUUID = uuidv4().replace(/-/g, "");
	return `${timestamp}-${randomUUID}`;
  }