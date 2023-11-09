const AWS = require("aws-sdk");

// Set your AWS region and Cognito User Pool ID
AWS.config.update({ region: "ap-south-1" });
const userPoolId = "ap-south-1_1M7FLYgyw";

// Initialize the Cognito Identity Provider client
const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();

// List of usernames to delete
const usernamesToDelete = []
async function deleteUser(username) {
  try {
    await cognitoIdentityServiceProvider
      .adminDeleteUser({
        UserPoolId: userPoolId,
        Username: username,
      })
      .promise();
    console.log(`User ${username} deleted successfully.`);
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
