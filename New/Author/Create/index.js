const mongoose = require('mongoose');
const Joi = require('joi');

const authorValidationSchema = Joi.object({
  name: Joi.string().required(),
});

const authorSchema = new mongoose.Schema({
  name: String,
  deleted: { type: Boolean, default: false },
}, {
  timestamps: true
});

const Author = mongoose.model('Author', authorSchema);

exports.handler = async (event) => {
  try {
    const { error, value } = authorValidationSchema.validate({ name: event.name });
    
    if (error) {
      console.log("Valerror",error)
      return {
        statusCode: 400,
        body: JSON.stringify({ message: error.details[0].message }),
      };
    }

    await mongoose.connect('mongodb://upmyranks:upmyranks@docdb-2023-04-09-13-10-41.cgaao9qpsg6i.ap-south-1.docdb.amazonaws.com:27017/upmyranks?ssl=true&retryWrites=false', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const authorName = value.name;

    const newAuthor = new Author({
      name: authorName,
    });

    const savedAuthor = await newAuthor.save();
    console.log("data", savedAuthor)

    await mongoose.disconnect();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Author created successfully' }),
    };
  } catch (error) {
    console.error('Error creating author:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error creating author' }),
    };
  }
};
