const AWS = require('aws-sdk');
const mongoose = require('mongoose');
const { Institute, Branch } = require('./schema')
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

exports.handler = async (event) => {
    try {
        let instituteId = event.pathParameters.instituteId;
        const { error: idError } = Joi.object({
            instituteId: Joi.objectId().required(),
        }).validate({ instituteId });

        if (idError) {
            console.log('err', idError);
            return {
                statusCode: 400,
                message: idError.details[0].message,
            };
        }

        await mongoose.connect("mongodb://upmyranks:upmyranks@docdb-2023-04-09-13-10-41.cgaao9qpsg6i.ap-south-1.docdb.amazonaws.com:27017/upmyranks?ssl=true&retryWrites=false");

        const instituteExist = await Institute.findOne({ _id: instituteId, deleted: false })

        if (!instituteExist) {
            console.log("bad request")
            return {
                statusCode: 400,
                message: "Institute not found with this _id"
            }
        }

        const startPage = 1;
        const minLimit = 10;

        const page = event.page || startPage;
        const limit = event.limit || minLimit;

        const skip = (page - 1) * limit;

        const branchdata = await Branch.find({ instituteId, deleted: false }).select('-logo -createdAt -updatedAt -deleted').skip(skip).limit(limit);
        await mongoose.disconnect();

        return {
            statusCode: 200,
            data: branchdata,
            page: page,
            limit: limit
        }

    } catch (err) {
        console.log("server error", err)
        return {
            statusCode: 500,
            message: 'Server Error'
        }
    }
}