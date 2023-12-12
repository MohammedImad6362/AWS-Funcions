const AWS = require("aws-sdk");
const mongoose = require("mongoose");
const batchSchema = require("./validations");
const {Branch, Batch} = require('./schema');

mongoose.connect("mongodb://upmyranks:upmyranks@docdb-2023-04-09-13-10-41.cgaao9qpsg6i.ap-south-1.docdb.amazonaws.com:27017/upmyranks?ssl=true&retryWrites=false",
    { useNewUrlParser: true, useUnifiedTopology: true });

exports.handler = async (event, context, callback) => {
    const { error } = batchSchema.validate(event);
    console.log("event", event)
    if (error) {
        console.log("valErr", error)
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: error.details[0].message,
            }),
        };
    }

    try {

        const existBranch = await Branch.findOne({ _id: event.branchId, deleted: false });

        if (!existBranch) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Branch not found with this id' }),
            };
        }

        const batchData = new Batch({
            branchId: event.branchId,
            name: event.name,
            courseIds: event.courseIds,
            startDate: event.startDate,
            endDate: event.endDate,
            startTime: event.startTime,
            endTime: event.endTime,
            isActive: event.isActive,
            studentLimit: event.studentLimit,
        });

        await batchData.save();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Batch added Successfully" })
        };
    } catch (err) {
        console.log("err", err)
        return {
            statusCode: 500,
            body: JSON.stringify({ message: err.message })
        };
    }
};

