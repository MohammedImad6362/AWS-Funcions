const AWS = require("aws-sdk");
const mongoose = require("mongoose");
const branchSchema = require("./validations");
const {Institute, Branch} = require('./schema');

mongoose.connect("mongodb://upmyranks:upmyranks@docdb-2023-04-09-13-10-41.cgaao9qpsg6i.ap-south-1.docdb.amazonaws.com:27017/upmyranks?ssl=true&retryWrites=false",
    { useNewUrlParser: true, useUnifiedTopology: true });

exports.handler = async (event, context, callback) => {
    const { error } = branchSchema.validate(event);
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

    let buf;

    if (event.logo) {
        buf = Buffer.from(
            event.logo.replace(/^data:image\/\w+;base64,/, ""),
            "base64"
        );
    }

    try {

        const existInstitute = await Institute.findOne({ _id: event.instituteId, deleted: false });

        if (!existInstitute) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Institute not found with this id' }),
            };
        }
        if (buf) {
            await uploadObjectToS3Bucket(event, buf);
        }

        const branchData = new Branch({
            instituteId: event.instituteId,
            name: event.name,
            logo: buf ? `allassestsupmyranks/courseimages/${new Date().toISOString()}_${event.name}.png` : '',
            address: event.address,
            area: event.area,
            city: event.city,
            state: event.state,
            pincode: event.pincode,
            contactNo: event.contactNo,
            isActive: event.isActive,
            expiryDate: event.expiryDate,
            batchStudentLimit: event.batchStudentLimit,
            studentLimit: event.studentLimit,
            teacherLimit: event.teacherLimit,
            nonTeacherLimit: event.nonTeacherLimit,
            courseIds: event.courseIds,
        });

        await branchData.save();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Branch added Successfully" })
        };
    } catch (err) {
        console.log("err", err)
        return {
            statusCode: 500,
            body: JSON.stringify({ message: err.message })
        };
    }
};

function uploadObjectToS3Bucket(event, data) {
    const s3 = new AWS.S3();
    const params = {
        Bucket: "allassestsupmyranks",
        Key: `courseimages/${event.name}.png`,
        Body: data,
    };

    return s3.upload(params).promise();
}
