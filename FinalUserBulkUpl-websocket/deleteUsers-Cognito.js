const AWS = require("aws-sdk");

// Set your AWS region, Cognito User Pool ID, and DynamoDB table name
AWS.config.update({ region: "ap-south-1" });
const userPoolId = "ap-south-1_1M7FLYgyw";

// Initialize the Cognito Identity Provider client and DynamoDB Document Client
const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();

// List of usernames to delete
const usernamesToDelete =   []

let notFound = 0;
let deleted = 0;
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
    deleted++;
  } catch (error) {
    if (error.code === "UserNotFoundException") {
      console.log(`User ${username} not found.`);
      notFound++;
    } else {
      console.error(`Error deleting user ${username}: ${error.message}`);
    }
  }
}

async function deleteUsers() {
  // await Promise.all(usernamesToDelete.map(async (username) => {
    for(const username of usernamesToDelete){
    await deleteUser(username);
    await new Promise(resolve => setTimeout(resolve, 50));
  // }));
    }
  console.log(`Total: ${usernamesToDelete.length}\t Deleted: ${deleted} \t Not Found: ${notFound}`);
}


deleteUsers();
