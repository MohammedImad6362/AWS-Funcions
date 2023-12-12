const AWS = require('aws-sdk');
const mongoose = require('mongoose');
const { Branch, Batch } = require('./schema')
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

exports.handler = async (event) => {
    try {
        let branchId = event.pathParameters.branchId;
        let batchId = event.pathParameters.id;

        const { error: idError } = Joi.object({
            branchId: Joi.objectId().required(),
            batchId: Joi.objectId().required(),
        }).validate({ branchId, batchId });

        if (idError) {
            console.log('err', idError);
            return response({
                statusCode: 400,
                body: JSON.stringify({ message: idError.details[0].message }),
            })
        }

        await mongoose.connect("mongodb://upmyranks:upmyranks@docdb-2023-04-09-13-10-41.cgaao9qpsg6i.ap-south-1.docdb.amazonaws.com:27017/upmyranks?ssl=true&retryWrites=false");
        console.log("Connection Successfull")

        const branchExist = await Branch.findOne({ _id: branchId, deleted: false })

        if (!branchExist) {
            console.log("bad request-branch")
            return response({
                statusCode: 404,
                body: JSON.stringify({ message: "Branch not found with this id" })
            })
        }

        const deleteBatch = await Batch.findByIdAndUpdate({ _id: batchId, deleted: false }, { $set: { deleted: true } }, { new: true })
        if (!deleteBatch) {
            console.log("bad request-batch")
            return response({
                statusCode: 400,
                body: JSON.stringify({ message: "Batch not found with this id" })
            })
        }
        await mongoose.disconnect();

        return response({
            statusCode: 200,
            body: JSON.stringify({ message: "Batch deleted successfully" })
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
            'Access-Control-Allow-Headers': 'Content-Type, instituteization',
        },
        statusCode: res.statusCode,
        body: res.body,
    };
};