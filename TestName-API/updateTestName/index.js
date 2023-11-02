const AWS = require('aws-sdk')
const DynamoDB = new AWS.DynamoDB.DocumentClient({ region: 'ap-south-1' })

exports.handler = async (event, context) => {
    try {
        await updateTestName(event);
        return {
            statusCode: 200,
            response: "TestName updated successfully...!"
        }
    }
    catch (err) {
        return {
            statusCode: 500,
            body: {
                error: 'Internal server error',
                message: err.message,
            },
        }
    }
}

const updateTestName = async (event) => {
    let params = {
        TableName: 'Test-Name-Testing',
        Key: {
            'test_name_id': event.test_name_id
        },
        UpdateExpression: 'set test_name = :test_name,  test_name_description= :test_name_description',
        ExpressionAttributeValues: {
            ':test_name': event.test_name,
            ':test_name_description': event.test_name_description
        },
        ReturnValues: 'ALL_OLD'
    }
    await DynamoDB.update(params).promise()
}
