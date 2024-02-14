const { createTest } = require("./validation");
const mongoose = require("mongoose");
const path = require("node:path");
const ObjectId = mongoose.Types.ObjectId;

exports.handler = async (event, context, callback) => {
  try {
    const body = event;

    const { error } = createTest.validate(body);
    if (error) {
      console.error("Validation error:", error.details[0].message);
      return {
        status: 400,
        data: error.details[0].message,
      };
    }

    await mongoose.connect(
      "mongodb://upmyranks:upmyranks@docdb-2023-04-09-13-10-41.cgaao9qpsg6i.ap-south-1.docdb.amazonaws.com:27017/upmyranks?ssl=true&retryWrites=false",
      {
        useNewUrlParser: true,
        ssl: true,
        sslValidate: false,
        sslCA: path.join(__dirname, "rds-combined-ca-bundle.pem"),
      }
    );

    const { test_id, user_id } = event;

    if (!ObjectId.isValid(test_id) || !ObjectId.isValid(user_id)) {
      return callback(null, {
        status: 400,
        data: "Kindly provide valid ids",
      });
    }

    const allTests = await mongoose.connection.collection(`institutetests`);
    const allUsers = await mongoose.connection.collection(`users`);

    let test = await allTests.findOne({ _id: new ObjectId(test_id) });
    const user = await allUsers.findOne({ _id: new ObjectId(user_id) });

    if (!user || !test) {
      return callback(null, {
        status: 400,
        data: "Kindly provide correct ids as no user or no test found for the id",
      });
    }

    if (
      user.role !== "superAdmin" &&
      `${user._id}` !== `${test.created_by.id}`
    ) {
      return {
        status: 400,
        data: "You are not authorized to delete the test.",
      };
    }

    const updateQuery = {
      ...event,
      last_updated_by: {
        id: user_id,
        date_time: new Date().toISOString(),
      },
    };

    delete updateQuery.test_id;
    delete updateQuery.user_id;

    test = await allTests.findOneAndUpdate(
      { _id: new ObjectId(test_id) },
      { $set: updateQuery },
      { returnDocument: "after" }
    );

    return {
      status: 200,
      data: test,
    };
  } catch (err) {
    console.log("Error", err);

    return {
      status: 400,
      data: err.message,
    };
  } finally {
    await mongoose.connection.close();
  }
};
