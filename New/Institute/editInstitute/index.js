const mongoose = require('mongoose');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const Institute = require('./schema')
const instituteSchema = require('./validations')

exports.handler = async (event) => {
  try {

    const instituteId = event.pathParameters.id;
    const { error: idError } = Joi.object({
      instituteId: Joi.objectId().required(),
    }).validate({ instituteId });

    if (idError) {
      console.log('err', idError);
      return response({
        statusCode: 400,
        body: JSON.stringify({ message: idError.details[0].message }),
      });
    }

    const reqBody = JSON.parse(event.body);

    const { error } = instituteSchema.validate(reqBody);
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

    const updatedinstitute = await Institute.findByIdAndUpdate(
      instituteId,
      { $set: { ...reqBody } },
      { new: true }
    );

    console.log("data", updatedinstitute);

    await mongoose.disconnect();

    if (!updatedinstitute) {
      return response({
        statusCode: 404,
        body: JSON.stringify({ message: 'Institute not found' }),
      });
    }

    return response({
      statusCode: 200,
      body: JSON.stringify({ message: 'Institute updated successfully' }),
    });
  } catch (error) {
    console.error('Error updating institute:', error);
    return response({
      statusCode: 500,
      body: JSON.stringify({ message: 'Error updating institute' }),
    });
  }
};

const response = (res) => {
  return {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, instituteization',
    },
    statusCode: res.statusCode,
    body: res.body,
  };
};