const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const docClient = new AWS.DynamoDB.DocumentClient();
const multipart = require('lambda-multipart-parser');

exports.handler = async (event, context) => {
    try {
        const file = await multipart.parse(event, true);

        if (!file.files || file.files.length === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "No file uploaded" }),
            };
        }

        const uploadedFile = file.files[0];
        console.log(uploadedFile);

        const file_name = uploadedFile.filename;
        const { filename, content } = uploadedFile;

        if (!file_name.toLowerCase().endsWith(".xlsx") && !file_name.toLowerCase().endsWith(".xlxs")) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: "Uploaded file must be an xlsx or xlxs file only",
                }),
            };
        }

        const created_at = new Date().toISOString();
        const file_id = `${file_name} ${created_at}`;

        // Define your S3 bucket name
        const bucketName = 'allassestsupmyranks';

        // Upload the Excel file to S3
        let objectKey = `xlxs/${file_name}`;

        await uploadFileToS3(bucketName, objectKey, content);

        // Store file information in DynamoDB
        await storeFileInfoInDynamoDB(file_id, created_at, file_name);

        return {
            statusCode: 200,
            body: JSON.stringify({ file_name, msg: "File information stored in DynamoDB and file uploaded to S3 successfully." }),
        };
    } catch (error) {
        console.error(`Error handling multipart/form-data: ${error}`);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

async function uploadFileToS3(bucketName, objectKey, content) {
    const params = {
        Bucket: bucketName,
        Key: objectKey,
        Body: content,
        ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    try {
        await s3.putObject(params).promise();
    } catch (error) {
        console.error(`Error uploading file to S3: ${error}`);
        throw error;
    }
}

async function storeFileInfoInDynamoDB(file_id, created_at, file_name) {
    const params = {
        TableName: 'Bulk_Upload',
        Item: {
            file_id,
            created_at,
            file_name,
        },
    };

    try {
        await docClient.put(params).promise();
    } catch (error) {
        console.error(`Error storing file information in DynamoDB: ${error}`);
        throw error;
    }
}
