var mongoose = require("mongoose");
const path = require("node:path");
var ObjectId = mongoose.Types.ObjectId;
const QUESTIONS_PER_PAGE = 10;

exports.handler = async (event, context, callback) => {
  try {
    const {
      batchId,
      subjectId,
      chapterId,
      topicId,
      questionTypes,
      limit,
      page,
    } = event;
    const questionsPerPage = !!limit ? limit : QUESTIONS_PER_PAGE;
    const skip = !!page ? (page - 1) * questionsPerPage : 0;

    await mongoose.connect(
      "mongodb://upmyranks:upmyranks@docdb-2023-04-09-13-10-41.cgaao9qpsg6i.ap-south-1.docdb.amazonaws.com:27017/upmyranks?ssl=true&retryWrites=false",
      {
        useNewUrlParser: true,
        ssl: true,
        sslValidate: false,
        sslCA: path.join(__dirname, "rds-combined-ca-bundle.pem"),
      }
    );

    const query = {};
    if (batchId) query.batchId = new ObjectId(batchId);
    if (subjectId) query.subjectId = new ObjectId(subjectId);
    if (chapterId) query.chapterId = new ObjectId(chapterId);
    if (topicId) query.topicId = new ObjectId(topicId);
    if (Array.isArray(questionTypes) && questionTypes.length !== 0)
      query.type = { $in: questionTypes };

    const questions = await mongoose.connection.collection(`questions_test`);
    const questionData = await questions
      .find(query)
      .sort()
      .skip(skip)
      .limit(questionsPerPage)
      .toArray();
    await mongoose.connection.close();

    return callback(null, {
      status_code: 200,
      response: {
        data: questionData,
      },
    });
  } catch (error) {
    console.log("Error:", error);
    return callback(null, {
      status_code: 500,
      error: error,
    });
  }
};
