const AWS = require('aws-sdk');

AWS.config.update({ region: 'ap-south-1' });

const dynamoDB = new AWS.DynamoDB.DocumentClient();

const tableName = 'Users';
const usernamesToDelete =  []



// Function to get user_id based on username
const getUserIDByUsername = async (userName) => {
  const queryParams = {
    TableName: tableName,
    IndexName: 'userName-index', // Replace with the actual index name for username
    KeyConditionExpression: 'userName = :userName',
    ExpressionAttributeValues: {
      ':userName': userName,
    },
    ProjectionExpression: 'user_id', // Include other attributes if needed
  };

  try {
    const queryResult = await dynamoDB.query(queryParams).promise();

    if (queryResult.Items && queryResult.Items.length > 0) {
      return queryResult.Items[0].user_id;
    } else {
      return null; // User not found
    }
  } catch (queryErr) {
    console.error(`Error querying for user_id with username '${userName}':`, queryErr);
    return null;
  }
};

// Function to delete an item based on user_id
const deleteItemByUserID = async (userID) => {
  const deleteParams = {
    TableName: tableName,
    Key: {
      user_id: userID,
      // Add additional key attributes if your table has a composite key
    },
  };

  try {
    await dynamoDB.delete(deleteParams).promise();
    console.log(`Item with user_id '${userID}' deleted successfully.`);
  } catch (deleteErr) {
    console.error(`Error deleting item with user_id '${userID}':`, deleteErr);
  }
};

// Iterate over each username in the array, get user_id, and delete the corresponding item
let notFound=0,deleted=0;
(async()=>{
// await Promise.all( usernamesToDelete.map(async (userName) => {
  for(const userName of usernamesToDelete){
    await new Promise(resolve => setTimeout(resolve, 50));
  const userID = await getUserIDByUsername(userName);
  if (userID) {
    await deleteItemByUserID(userID);
    deleted++;
  } else {
    console.log(`User with username '${userName}' not found.`);
    notFound++;
  }
// }));
}

console.log(`Total: ${usernamesToDelete.length}\t Deleted: ${deleted} \t Not Found: ${notFound}`)
})()
