const AWS = require("aws-sdk");
const mongoose = require("mongoose");
const Institute = require('./schema');

mongoose.connect("mongodb://upmyranks:upmyranks@docdb-2023-04-09-13-10-41.cgaao9qpsg6i.ap-south-1.docdb.amazonaws.com:27017/upmyranks?ssl=true&retryWrites=false",
    { useNewUrlParser: true, useUnifiedTopology: true });

exports.handler = async (event, context, callback) => {
    try {
        const institutes = await Institute.find({ deleted: false });
        return {
            statusCode: 200,
            body: JSON.stringify({ data: institutes }),
        };
    } catch (err) {
        console.error("Error:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error" }),
        };
    }
};
