const AWS = require("aws-sdk");
const mongoose = require("mongoose");
const Institute = require('./schema');

mongoose.connect("mongodb://upmyranks:upmyranks@docdb-2023-04-09-13-10-41.cgaao9qpsg6i.ap-south-1.docdb.amazonaws.com:27017/upmyranks?ssl=true&retryWrites=false",
    { useNewUrlParser: true, useUnifiedTopology: true });

exports.handler = async (event, context, callback) => {
    try {
        const startPage = 1;
        const minLimit = 10;

        const page = event.page || startPage;
        const limit = event.limit || minLimit;

        const skip = (page - 1) * limit;
        const institutes = await Institute.find({ deleted: false }).select('-createdAt -updatedAt -logo -deleted').skip(skip).limit(limit);
        return {
            statusCode: 200,
            data: institutes,
            page: page,
            limit: limit
        };
    } catch (err) {
        console.error("Error:", err);
        return {
            statusCode: 500,
            message: "Internal Server Error"
        };
    }
};
