const mongoose = require('mongoose');
const batchSchema = require('./validations');
const { Branch, Batch } = require('./schema');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

exports.handler = async (event) => {
  try {
    const branchId = event.pathParameters.branchId;
    const batchId = event.pathParameters.id;

    const { error: idError } = Joi.object({
      branchId: Joi.objectId().required(),
      batchId: Joi.objectId().required()
    }).validate({ branchId, batchId })

    if (idError) {
      console.log("valErr", idError);
      return response({
        statusCode: 400,
        body: JSON.stringify({ message: idError.details[0].message })
      })
    }

    const reqBody = JSON.parse(event.body);

    const { error } = batchSchema.validate(reqBody);
    if (error) {
      return response({
        statusCode: 400,
        body: JSON.stringify({ message: error.details[0].message }),
      });
    }

    await mongoose.connect("mongodb://upmyranks:upmyranks@docdb-2023-04-09-13-10-41.cgaao9qpsg6i.ap-south-1.docdb.amazonaws.com:27017/upmyranks?ssl=true&retryWrites=false");
    console.log("Connection successfully");

    const existBranch = await Branch.findOne({ _id: branchId, deleted: false })
    if (!existBranch) {
      console.log("bad request-branch");
      return response({
        statusCode: 404,
        body: JSON.stringify({ message: 'Branch not found with this id' })
      })
    }


    const updateBatch = await Batch.findByIdAndUpdate({ _id: batchId, deleted: false },
      { $set: { ...reqBody } },
      { new: true }
    )

    if (!updateBatch) {
      console.log("bad request-batch")
      return response({
        statusCode: 404,
        body: JSON.stringify({ message: "Batch not found with this id" })
      })
    }
    await mongoose.disconnect();

    return response({
      statusCode: 200,
      body: JSON.stringify({ message: "Batch updated successfully" })
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
      body: JSON.stringify({
          ...JSON.parse(res.body),
          statusCode: res.statusCode,
      }),
  };
};