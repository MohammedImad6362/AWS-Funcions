const AWS = require('aws-sdk');
const mongoose = require('mongoose');
const {Institute, Branch} = require('./schema')
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
                body: JSON.stringify({ message: idError.details[0].message }),
            };
        }

        await mongoose.connect("mongodb://upmyranks:upmyranks@docdb-2023-04-09-13-10-41.cgaao9qpsg6i.ap-south-1.docdb.amazonaws.com:27017/upmyranks?ssl=true&retryWrites=false",
            {
                useNewUrlParser: true,
                useUnifiedTopology: true
            }
        );

        const instituteExist = await Institute.findOne({_id: instituteId, deleted: false})
        
        if(!instituteExist){
            console.log("bad request")
            return {
                statusCode: 400,
                body: JSON.stringify({message: "Institute not found with this _id"})
            }
        }

        const branchdata = await Branch.find({instituteId, deleted: false})
        await mongoose.disconnect();

        return{
            statusCode: 200,
            body: JSON.stringify({data: branchdata})
        }

    } catch (err) {
        console.log("server error",err)
        return{
            statusCode: 500,
            body: JSON.stringify({message: 'Server Error'})
        }
    }
}