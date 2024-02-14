const mongoose = require("mongoose");
const path = require("node:path");
const { superAdminTemplateValidation } = require("./validation");
const { SuperAdminTestTemplate } = require("./SuperAdminTestTemplate");

exports.handler = async (event) => {
  try {
    const body = event;

    const { error } = superAdminTemplateValidation.validate(body);
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
    } else {
      const isTestCreated = await SuperAdminTestTemplate.findOne({
        test_name: body.test_name,
      });

      if (isTestCreated) {
        return {
          status: 403,
          data: "You have already created test with the same name",
        };
      }

      const newTestTemplate = await SuperAdminTestTemplate.create(body);

      return {
        status: 200,
        data: newTestTemplate,
      };
    }
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
