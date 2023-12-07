const mongoose = require('mongoose');

const authorSchema = new mongoose.Schema({
  name: String,
});

const Author = mongoose.model('Author', authorSchema);

exports.handler = async (event) => {
  try {
    // Connect to MongoDB using Mongoose
    await mongoose.connect('mongodb://upmyranks:upmyranks@docdb-2023-04-09-13-10-41.cgaao9qpsg6i.ap-south-1.docdb.amazonaws.com:27017/upmyranks?ssl=true&retryWrites=false', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const result = await Author.find({deleted:false});

    await mongoose.disconnect();

    return {
      statusCode: 200,
      body: JSON.stringify({ authors: result }),
    };
  } catch (error) {
    console.error('Error getting authors:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error getting authors', error: error.message }),
    };
  }
};
