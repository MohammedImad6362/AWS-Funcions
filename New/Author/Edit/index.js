const mongoose = require('mongoose');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

const authorValidationSchema = Joi.object({
  name: Joi.string().required(),
});

const authorSchema = new mongoose.Schema({
  name: String,
}, {
  timestamps: true
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

    const { name } = JSON.parse(event.body);

    const { error, value } = authorValidationSchema.validate({ name });
    if (error) {
      return response({
        statusCode: 400,
        body: JSON.stringify({ message: error.details[0].message }),
      });
    }

    await mongoose.connect('mongodb://upmyranks:upmyranks@docdb-2023-04-09-13-10-41.cgaao9qpsg6i.ap-south-1.docdb.amazonaws.com:27017/upmyranks?ssl=true&retryWrites=false', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const updatedAuthor = await Author.findByIdAndUpdate(
      authorId,
      { $set: { name: value.name } },
      { new: true }
    );

    console.log("data", updatedAuthor);

    await mongoose.disconnect();

    if (!updatedAuthor) {
      return response({
        statusCode: 404,
        body: JSON.stringify({ message: 'Author not found' }),
      });
    }

    return response({
      statusCode: 200,
      body: JSON.stringify({ message: 'Author updated successfully' }),
    });
  } catch (error) {
    console.error('Error updating author:', error);
    return response({
      statusCode: 500,
      body: JSON.stringify({ message: 'Error updating author' }),
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