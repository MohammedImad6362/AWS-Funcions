const { createTest } = require("./validation");
const mongoose = require("mongoose");
const path = require("node:path");
const { InstituteTest } = require("./instituteTest");

exports.handler = async (event) => {
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

    if (body.isErp) {
      return {
        status: 400,
        data: "Not implemented yet",
      };
    }

    const isTestCreated = await InstituteTest.findOne({
      institute_test_name: body.institute_test_name,
    });

    if (isTestCreated) {
      return {
        status: 401,
        data: "Test with the same name already exists",
      };
    }

    const newTest = await InstituteTest.create({
      ...body,
    });

    return {
      status: 200,
      data: newTest,
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
