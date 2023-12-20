const mongoose = require('mongoose')
const Joi = require('joi');
const { Branch, Batch } = require('./schema');
Joi.objectId = require('joi-objectid')(Joi);

exports.handler = async (event) => {
  try {
    const branchId = event.pathParameters.branchId;
    const { error: idError } = Joi.object({
      branchId: Joi.objectId().required()
    }).validate({ branchId })

    if (idError) {
      console.log('ValErr', idError);
      return {
        statusCode: 400,
        message: idError.details[0].message,
      };
    }

    await mongoose.connect('mongodb://upmyranks:upmyranks@docdb-2023-04-09-13-10-41.cgaao9qpsg6i.ap-south-1.docdb.amazonaws.com:27017/upmyranks?ssl=true&retryWrites=false')
    console.log("Connection Successfull")

    const existBranch = await Branch.findOne({ _id: branchId, deleted: false })
    if (!existBranch) {
      console.log("bad request-branch")
      return {
        statusCode: 404,
        message: 'Branch not found with this id'
      }
    }

    const startPage = 1;
    const minLimit = 10;

    const page = event.page || startPage;
    const limit = event.limit || minLimit;

    const skip = (page - 1) * limit;

    const batchData = await Batch.find({ deleted: false }).select('-createdAt -updatedAt -deleted').skip(skip).limit(limit);

    await mongoose.disconnect();

    return {
      statusCode: 200,
      data: batchData,
      page: page,
      limit: limit
    }

  } catch (err) {
    console.log("server error", err)
    return {
      statusCode: 500,
      message: 'Server error'
    }
  }
}