const mongoose = require('mongoose');
const Joi = require('joi')
Joi.objectId = require('joi-objectid')(Joi);

const authorSchema = new mongoose.Schema({
    name: String,
    deleted: { type: Boolean, default: false }
});

const Author = mongoose.model('Author', authorSchema);

exports.handler = async (event) => {
    try {
        await mongoose.connect('mongodb://upmyranks:upmyranks@docdb-2023-04-09-13-10-41.cgaao9qpsg6i.ap-south-1.docdb.amazonaws.com:27017/upmyranks?ssl=true&retryWrites=false');
        console.log("Connection Successfull")

        const authorId = event.pathParameters.id;
        const { error: idError } = Joi.object({
            authorId: Joi.objectId().required(),
        }).validate({ authorId });

        if (idError) {
            console.log('err', idError);
            return response({
                statusCode: 400,
                body: JSON.stringify({ message: idError.details[0].message }),
            });
        }

        const result = await Author.findByIdAndUpdate(
            authorId,
            { $set: { deleted: true } },
            { new: true }
        );

        await mongoose.disconnect();

        if (!result) {
            return response({
                statusCode: 404,
                body: JSON.stringify({ message: 'Author not found' }),
            });
        }

        return response({
            statusCode: 200,
            body: JSON.stringify({ message: 'Author deleted successfully' }),
        });
    } catch (error) {
        console.error('Error deleting author:', error);
        return response({
            statusCode: 500,
            body: JSON.stringify({ message: 'Error deleting author' }),
        });
    }
};

const response = (res) => {
    return {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        statusCode: res.statusCode,
        body: res.body,
    };
};