const mongoose = require('mongoose')
const Joi = require('joi');
const { Branch, Batch } = require('./schema');
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
      console.log('ValErr', idError);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: idError.details[0].message }),
      };
    }

    await mongoose.connect('mongodb://upmyranks:upmyranks@docdb-2023-04-09-13-10-41.cgaao9qpsg6i.ap-south-1.docdb.amazonaws.com:27017/upmyranks?ssl=true&retryWrites=false')
    console.log("Connection Successfull")

    const existBranch = await Branch.findOne({ _id: branchId, deleted: false })
    if (!existBranch) {
      console.log("bad request-branch")
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Branch not found with this id' })
      }
    }

    const batchData = await Batch.findOne({ _id: batchId, deleted: false })
    if (!batchData) {
      console.log("bad request-branch")
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Batch not found with this id' })
      }
    }
    await mongoose.disconnect();

    return {
      statusCode: 200,
      body: JSON.stringify({ data: batchData })
    }

  } catch (err) {
    console.log("server error", err)
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server error' })
    }
  }
}