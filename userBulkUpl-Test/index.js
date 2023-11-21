const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const multipart = require('lambda-multipart-parser');
const lambda = new AWS.Lambda();
const uuid = require("uuid");
const Joi = require("joi");


exports.handler = async (event, context) => {
    try {
        const bulkUploadUsersDetails = Joi.object({
            instituteId: Joi.string().required(),
            branchId: Joi.string().required(),
            batchId: Joi.string().allow(''),
        });

        const formData = await multipart.parse(event, true);
        if (!formData.files || formData.files.length === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "No file uploaded" }),
            };
        }

        const uploadedFile = formData.files[0];
        if (!filename.toLowerCase().endsWith(".xlsx") && !filename.toLowerCase().endsWith(".xlxs")) {
            return response({
                statusCode: 400,
                body: JSON.stringify({
                    message: "Uploaded file must be a xlsx or xlxs file only",
                }),
            });
        }

        const { filename, content } = uploadedFile;
        const { instituteId, branchId, batchId } = formData;

        const { error } = bulkUploadUsersDetails.validate({
            instituteId,
            branchId,
            batchId
        });
        if (error) {
            console.error("Validation error:", error.details[0].message);
            return response({
                statusCode: 400,
                body: JSON.stringify({ message: error.details[0].message }),
            });
        }


        const processing_id = uuid.v4();
        const bucketName = 'allassestsupmyranks';
        let objectKey = `xlxs/${filename}`;

        await uploadFileToS3(bucketName, objectKey, content);

        // Store file information in DynamoDB
        await storeFileInfoInDynamoDB(processing_id, filename, objectKey, instituteId, branchId, batchId);
        console.log("response: File information stored in DynamoDB and file uploaded to S3 successfully.")
        return response({
            statusCode: 200,
            body: JSON.stringify({ processing_id, message: "File processing" }),
        });
    }
    catch (error) {
        console.error(`Error handling multipart/form-data: ${error}`);
        return response({
            statusCode: 500,
            body: JSON.stringify({ message: error.message })
        })
    }
};

async function uploadFileToS3(bucketName, objectKey, content) {
    const params = {
        Bucket: bucketName,
        Key: objectKey,
        Body: content,
        ContentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };

    try {
        await s3.putObject(params).promise();
    }
    catch (error) {
        console.error(`Error uploading file to S3: ${error}`);
        throw error;
    }
}

async function storeFileInfoInDynamoDB(processing_id, filename, objectKey, instituteId, branchId, batchId) {
    const dbItem = {
        processing_id,
        created_at: new Date().toISOString(),
        filename,
        s3Path: objectKey,
        uploaded: false,
        instituteId,
        branchId,
        batchId: batchId || null,
        branchBatchId: batchId ? `${branchId}_${batchId}` : branchId 
    }
    const params = {
        TableName: 'BulkUploadFiles',
        Item: dbItem,
    };
    await dynamoDB.put(params).promise();
    const paramsToLambda = {
        FunctionName: "Create_Cognito_users",
        InvocationType: "Event",
        Payload: JSON.stringify(dbItem),
    };
    await lambda.invoke(paramsToLambda).promise();
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
