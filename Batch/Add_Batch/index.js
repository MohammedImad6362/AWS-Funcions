const AWS = require("aws-sdk");
const s3 = new AWS.S3({ region: "ap-south-1" });
const db = new AWS.DynamoDB.DocumentClient({ region: "ap-south-1" });
const Joi = require("joi");

exports.handler = async (event, context, callback) => {
	const validationSchema = Joi.object({
		institute_id: Joi.string().required(),
		branch_id: Joi.string().required(),
		id: Joi.string().required(),
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
	var data_modified = [];

	await GetInstitute(event)
		.then(async (data) => {
			data.Items[0].branches.forEach((loop_data) => {
				if (event.branch_id === loop_data.branch_id) {
					loop_data.batch.push(event);
					data_modified.push(loop_data);
				} else {
					data_modified.push(loop_data);
				}
			});

			console.log(data_modified);

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
			return callback(null, {
				status_code: 400,
				response: error,
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

