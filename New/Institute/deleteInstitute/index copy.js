const mongoose = require('mongoose');
const { startSession } = require('mongoose');
const Joi = require('joi');
const { Institute, Branch, Batch } = require('./schema');
Joi.objectId = require('joi-objectid')(Joi);

exports.handler = async (event) => {
    let session;

    try {
        const instituteId = event.pathParameters.id;

        const { error: idError } = Joi.object({
            instituteId: Joi.objectId().required(),
        }).validate({ instituteId });

        if (idError) {
            console.log('err', idError);
            return response({
                statusCode: 400,
                body: JSON.stringify({ message: idError.details[0].message }),
            });
        }

        await mongoose.connect('mongodb://upmyranks:upmyranks@docdb-2023-04-09-13-10-41.cgaao9qpsg6i.ap-south-1.docdb.amazonaws.com:27017/upmyranks?ssl=true&retryWrites=false', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        session = await startSession();
        await session.startTransaction();

        try {
            await deleteInstituteAndItsData(instituteId, session);

            await session.commitTransaction();
        } catch (err) {
            console.error('Transaction Error:', err);
            await session.abortTransaction();
            throw err;
        } finally {
            session.endSession();
            await mongoose.disconnect();
        }

        return response({
            statusCode: 200,
            body: JSON.stringify({ message: 'Institute deleted successfully' }),
        });
    } catch (error) {
        console.error('Error getting institute:', error);
        return response({
            statusCode: 500,
            body: JSON.stringify({ message: 'Error getting institute' }),
        });
    }
};


const deleteInstituteAndItsData = async (instituteId, session) => {
    // Find all branchIds associated with the given instituteId
    const branchData = await Branch.find({ instituteId, deleted: false });
    console.log(branchData);

    for (let i = 0; i < branchData.length; i++) {
        const branchId = branchData[i]._id;
        console.log("branchId", branchId);

        // Iterate through each branchId and update batches
        const deletedBatch = await Batch.updateOne(
            { branchId, deleted: false },
            { $set: { deleted: true } },
            { session }
        );

        console.log("bat", deletedBatch);
    }

    // Delete all branches with the given instituteId
    await Branch.updateMany({ instituteId, deleted: false }, { $set: { deleted: true } }, { session });

    // Finally delete the institute
    const result = await Institute.findByIdAndUpdate(
        instituteId,
        { $set: { deleted: true } },
        { new: true, session }
    );

    if (!result) {
        throw new Error('Institute not found with this id');
    }

    return result;
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
        body: res.body
    }
}
