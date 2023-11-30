const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

exports.handler = async (event) => {
  const validationSchema = Joi.object({
    user_id: Joi.string().required(),
    question_ids: Joi.array().items(Joi.objectId()).required(),
  });

 const { error } = validationSchema.validate(event);

  if (error) {
    return {
      statusCode: 400,
      body: {
        error: 'Bad Request',
        msg: error.details[0].message,
      },
    };
  }

  const userId = event.user_id;
  const questionIds = event.question_ids;

  if (!questionIds || !userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing required parameters' }),
    };
  }

  // Check if the user exists
  const userExists = await checkUserExists(userId);
  if (!userExists) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'User not found' }),
    };
  }

  // Check if the question_ids already exist in the favoriteQuestions array
  const existingQuestions = await getFavoriteQuestions(userId);
  const newQuestions = questionIds.filter((questionId) => !existingQuestions.includes(questionId));

  if (newQuestions.length === 0) {
    return {
      statusCode: 200,
      body: { message: 'These questions are already in favourites list', favouriteQuestions: existingQuestions },
    };
  }

  const params = {
    TableName: 'Users_UAT',
    Key: { 'user_id': userId },
    UpdateExpression: 'SET #favorites = list_append(if_not_exists(#favorites, :emptyList), :newQuestions)',
    ExpressionAttributeNames: {
      '#favorites': 'favoriteQuestions',
    },
    ExpressionAttributeValues: {
      ':newQuestions': newQuestions,
      ':emptyList': [],
    },
    ReturnValues: 'ALL_NEW',
  };

  try {
    const result = await dynamoDB.update(params).promise();
    return {
      statusCode: 200,
      body: { message: 'Questions added to favorites successfully', favouriteQuestions: result.Attributes.favoriteQuestions },
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: { message: 'Internal Server Error' },
    };
  }
};

async function checkUserExists(userId) {
  const params = {
    TableName: 'Users_UAT',
    Key: { 'user_id': userId },
  };

  try {
    const result = await dynamoDB.get(params).promise();
    return !!result.Item;
  } catch (error) {
    console.error('Error checking user existence:', error);
    throw error;
  }
}

async function getFavoriteQuestions(userId) {
  const params = {
    TableName: 'Users_UAT',
    Key: { 'user_id': userId },
    ProjectionExpression: 'favoriteQuestions',
  };

  try {
    const result = await dynamoDB.get(params).promise();
    return result.Item ? result.Item.favoriteQuestions || [] : [];
  } catch (error) {
    console.error('Error getting favorite questions:', error);
    throw error;
  }
}
