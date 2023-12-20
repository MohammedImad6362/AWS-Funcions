const AWS = require('aws-sdk');
const mongoose = require('mongoose');
const { Institute, Branch } = require('./schema')
const Joi = require('joi');
const branchSchema = require('./validations');
Joi.objectId = require('joi-objectid')(Joi);

exports.handler = async (event) => {
  try {
    let instituteId = event.pathParameters.instituteId;
    let branchId = event.pathParameters.id;

    const { error: idError } = Joi.object({
      instituteId: Joi.objectId().required(),
      branchId: Joi.objectId().required(),
    }).validate({ instituteId, branchId });

    if (idError) {
      console.log('err', idError);
      return response({
        statusCode: 400,
        body: JSON.stringify({ message: idError.details[0].message }),
      });
    }

    const reqBody = JSON.parse(event.body);

    const { error } = branchSchema.validate(reqBody);
    if (error) {
      return response({
        statusCode: 400,
        body: JSON.stringify({ message: error.details[0].message }),
      });
    }

    await mongoose.connect("mongodb://upmyranks:upmyranks@docdb-2023-04-09-13-10-41.cgaao9qpsg6i.ap-south-1.docdb.amazonaws.com:27017/upmyranks?ssl=true&retryWrites=false",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    );

    const instituteExist = await Institute.findOne({ _id: instituteId, deleted: false })

    if (!instituteExist) {
      console.log("bad request-inst")
      return response({
        statusCode: 404,
        body: JSON.stringify({ message: "Institute not found with this id" })
      })
    }

    const updateBranch = await Branch.findByIdAndUpdate({ _id: branchId, deleted: false },
      { $set: { ...reqBody } },
      { new: true }
    )
    if (!updateBranch) {
      console.log("bad request-branch")
      return response({
        statusCode: 404,
        body: JSON.stringify({ message: "Branch not found with this id" })
      })
    }
    await mongoose.disconnect();

    return response({
      statusCode: 200,
      body: JSON.stringify({ message: "Branch updated successfully" })
    })

  } catch (err) {
    console.log("server error", err)
    return response({
      statusCode: 500,
      body: JSON.stringify({ message: 'Server Error' })
    })
  }
}

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