const mongoose = require('mongoose');
const Joi = require('joi');

const authorSchema = new mongoose.Schema({
  name: String,
  profileImage: String
});

const Author = mongoose.model('Author', authorSchema);

exports.handler = async (event) => {
  const START_PAGE = 1;
  const MIN_LIMIT = 20;
  try {
    await mongoose.connect('mongodb://upmyranks:upmyranks@docdb-2023-04-09-13-10-41.cgaao9qpsg6i.ap-south-1.docdb.amazonaws.com:27017/upmyranks?ssl=true&retryWrites=false');
    console.log("Connection Successful");

    const queryStringParameters = event.queryStringParameters;

    const paginationValues = Joi.object({
      page: Joi.number().integer().min(1),
      limit: Joi.number().integer().min(1),
    });


    const { error } = queryStringParameters
      ? paginationValues.validate(queryStringParameters)
      : {};

    if (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: error.details[0].message })
      }
    }

    const page = queryStringParameters?.page || START_PAGE;
    const limit = queryStringParameters?.limit || MIN_LIMIT;

    const skip = (page - 1) * limit;

    const resultQuery = Author.find({ deleted: false })
      .select("name profileImage createdAt")
      .skip(skip)
      .limit(limit);

    const totalCountQuery = Author.countDocuments({ deleted: false });

    const [result, totalCount] = await Promise.all([
      resultQuery,
      totalCountQuery,
    ]);

    await mongoose.disconnect();

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: result,
        page: page,
        limit: limit,
        total: totalCount
      })
    };
  } catch (error) {
    console.error('Error getting authors:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error getting authors',
        error: error.message
      })
    }
  };
}