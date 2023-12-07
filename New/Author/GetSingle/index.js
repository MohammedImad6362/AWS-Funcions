const mongoose = require('mongoose');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

const authorSchema = new mongoose.Schema({
  name: String,
});

const Author = mongoose.model('Author', authorSchema);

exports.handler = async (event) => {
  try {
    const authorId = event.pathParameters.id;

    const { error: idError } = Joi.object({
      authorId: Joi.objectId().required(),
    }).validate({ authorId });

    if (idError) {
      console.log('err', idError);
      return response({
        statusCode: 400,
        body: JSON.stringify({ message: idError.details[0].message }),
      });
    }

    await mongoose.connect('mongodb://upmyranks:upmyranks@docdb-2023-04-09-13-10-41.cgaao9qpsg6i.ap-south-1.docdb.amazonaws.com:27017/upmyranks?ssl=true&retryWrites=false', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const result = await Author.findOne({ _id: authorId, deleted: false });

    await mongoose.disconnect();

    if (!result) {
      return response({
        statusCode: 404,
        body: JSON.stringify({ message: 'Author not found' }),
      });
    }

    return response({
      statusCode: 200,
      body: JSON.stringify({ data: result }),
    });
  } catch (error) {
    console.error('Error getting author:', error);
    return response({
      statusCode: 500,
      body: JSON.stringify({ message: 'Error getting author' }),
    });
  }
};

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
