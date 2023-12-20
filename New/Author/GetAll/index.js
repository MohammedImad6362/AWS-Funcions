const mongoose = require('mongoose');

const authorSchema = new mongoose.Schema({
  name: String,
  // Add other fields as needed
});

const Author = mongoose.model('Author', authorSchema);

exports.handler = async (event) => {
  try {
    await mongoose.connect('mongodb://upmyranks:upmyranks@docdb-2023-04-09-13-10-41.cgaao9qpsg6i.ap-south-1.docdb.amazonaws.com:27017/upmyranks?ssl=true&retryWrites=false');
    console.log("Connection Successful");
    const startPage = 1;
    const minLimit = 10;

    const page = event.page || startPage;
    const limit = event.limit || minLimit;

    const skip = (page - 1) * limit;

    const result = await Author.find({ deleted: false })
      .select('_id name')
      .skip(skip)
      .limit(limit);

    await mongoose.disconnect();

    return {
      statusCode: 200,
      data: result,
      page: page,
      limit: limit
    };
  } catch (error) {
    console.error('Error getting authors:', error);
    return {
      statusCode: 500,
      body: {
        message: 'Error getting authors',
        error: error.message,
      },
    };
  }
};
