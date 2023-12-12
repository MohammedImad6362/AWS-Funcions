const AWS = require("aws-sdk");
const s3 = new AWS.S3({ region: "ap-south-1" });
const db = new AWS.DynamoDB.DocumentClient({ region: "ap-south-1" });
const { v4: uuidv4 } = require("uuid");
const Joi = require("joi");
const { createBranch } = require("./validation");

exports.handler = async (event) => {
  const body = event;
  try {
    const { error } = createBranch.validate(body);
    if (error) {
      console.error("Validation error:", error.details[0].message);
      return {
        statusCode: 400,
        response: error.details[0].message,
      };
    }
    const { email, password } = body;
    // delete body.email;
    delete body.password;
    body.branch_id = `BR-${createUniqueID()}`;
    const userData = {
      email,
      password,
      entities_connected_with: [
        {
          entity_name: body.name,
          branch_id: body.branch_id,
          institute_id: body.institute_id,
          role: "BRANCH",
        },
      ],
    };
    
    //S3 Upload
    const buf = Buffer.from(
      event.logo.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );

    await uploadObjectToS3Bucket(body, buf);

    const { emailExists, user } = await checkEmailExists(email);
    if (emailExists) {
      // const roleExist = user.entities_connected_with.find(entity=>(entity.role === 'BRANCH'))
      // if(roleExist) return {
      //   statusCode: 400,
      //   response: "User already exists for this role",
      // };
      console.log("emailExists");
      await updateBranch(
        body,
        {
          user_id: user.user_id,
          entities_connected_with: userData.entities_connected_with,
        },
        true
      );
    } else {
      await updateBranch(body, userData);
    }
    

    return {
      statusCode: 200,
      response: "Branch Inserted",
    };
  } catch (error) {
    console.log("Error", error);
    return {
      statusCode: 400,
      response: error.message,
    };
  }
};

async function uploadObjectToS3Bucket(body, Data) {
  const params = {
    Bucket: "allassestsupmyranks",
    Key: `courseimages/${body.branch_id}.png`,
    Body: Data,
  };

  return s3.upload(params).promise();
}

async function updateBranch(data, userData, userUpdate) {
  const branchData = [data];
  data.batch = [];
  data.logo = "courseimages/" + data.branch_id + ".png";

  const params = {
    TransactItems: [
      userUpdate
        ? {
            Update: {
              TableName: "Users",
              Key: {
                user_id: userData.user_id,
              },
              UpdateExpression:
                "SET #attrName = list_append(#attrName, :attrValue)",
              ExpressionAttributeNames: {
                "#attrName": "entities_connected_with",
              },
              ExpressionAttributeValues: {
                ":attrValue": userData.entities_connected_with,
              },
              ReturnValues: "ALL_NEW",
            },
          }
        : {
            Put: {
              TableName: "Users",
              Item: {
                user_id: `USER-${createUniqueID()}`,
                ...userData,
              },
              // ConditionExpression: 'attribute_not_exists(PK)', // Optional condition
            },
          },
      {
        Update: {
          TableName: "Institute",
          Key: {
            institute_id: data.institute_id,
          },
          UpdateExpression:
            "SET #attrName = list_append(#attrName, :attrValue)",
          ExpressionAttributeNames: {
            "#attrName": "branches",
          },
          ExpressionAttributeValues: {
            ":attrValue": branchData,
          },
          ReturnValues: "ALL_NEW",
        },
      },
    ],
  };

  // const params = {
  //   TableName: "Institute",
  //   Key: {
  //     institute_id: data.institute_id,
  //   },
  //   UpdateExpression: "SET #attrName = list_append(#attrName, :attrValue)",
  //   ExpressionAttributeNames: {
  //     "#attrName": "branches",
  //   },
  //   ExpressionAttributeValues: {
  //     ":attrValue": branchData,
  //   },
  //   ReturnValues: "ALL_NEW",
  // };

  // return db.update(params).promise();
  return db.transactWrite(params).promise();
}

const checkEmailExists = async (email) => {
  const params = {
    TableName: "Users", // Replace with your table name
    IndexName: "email-index", // Replace with the name of your GSI (if you have one)
    KeyConditionExpression: "email = :email",
    ExpressionAttributeValues: {
      ":email": email,
    },
  };

  try {
    const data = await db.query(params).promise();
    return {
      emailExists: data.Items.length > 0,
      user: data.Items && data.Items[0],
    }; // Return true if email exists, false otherwise
  } catch (error) {
    console.error("Error:", error);
    throw error; // Handle the error or rethrow it if needed
  }
};

function createUniqueID() {
  const timestamp = new Date().getTime();
  const randomUUID = uuidv4().replace(/-/g, "");
  return `${timestamp}-${randomUUID}`;
}
