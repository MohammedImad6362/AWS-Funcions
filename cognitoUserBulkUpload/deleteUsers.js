const AWS = require("aws-sdk");

// Set your AWS region, Cognito User Pool ID, and DynamoDB table name
AWS.config.update({ region: "ap-south-1" });
const userPoolId = "ap-south-1_1M7FLYgyw";
const dynamoDBTableName = "Users"; // Replace with your DynamoDB table name

// Initialize the Cognito Identity Provider client and DynamoDB Document Client
const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// List of usernames to delete
const usernamesToDelete = []

async function deleteUser(username) {
  try {
    // Delete user from Cognito User Pool
    await cognitoIdentityServiceProvider
      .adminDeleteUser({
        UserPoolId: userPoolId,
        Username: username,
      })
      .promise();

    console.log(`User ${username} deleted from Cognito User Pool successfully.`);

    // Delete user from DynamoDB table
    await dynamoDB
      .delete({
        TableName: dynamoDBTableName,
        Key: {
          user_id: username,
        },
      })
      .promise();

    console.log(`User ${username} deleted from DynamoDB table successfully.`);
  } catch (error) {
    if (error.code === "UserNotFoundException") {
      console.log(`User ${username} not found.`);
    } else {
      console.error(`Error deleting user ${username}: ${error.message}`);
    }
  }
}

async function deleteUsers() {
  for (const username of usernamesToDelete) {
    await deleteUser(username);
  }
}

// Call the deleteUsers function to start deleting users
deleteUsers();
