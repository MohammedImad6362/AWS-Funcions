// TODO: Handle Multiple MCQ Any and Number-Range
const fs = require("fs");
const path = require("path");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const cheerio = require("cheerio");
const axios = require("axios");
const FormData = require("form-data");
const AWS = require("aws-sdk");
const uuid = require("uuid");
const xlsx = require("xlsx");
// const multipart = require("lambda-multipart-parser");
const { default: mongoose } = require("mongoose");
const QRQuestion = require("./QRQuestion");
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const SOCKET_ENDPOINT =
  "https://h7r59bw0yl.execute-api.ap-south-1.amazonaws.com/production";
const apiGateway = new AWS.ApiGatewayManagementApi({
  apiVersion: "2018-11-29",
  endpoint: SOCKET_ENDPOINT,
});

AWS.config.update({ region: "ap-south-1" });
const s3 = new AWS.S3({ region: "ap-south-1" });
const bucketName = "jsonimages";
const bucketDomainName = "testimages.futuretechschool.in";

const ZAMZAR_API = "https://api.zamzar.com/v1/";
const ZAMZAR_API_KEY = "40a3e5327fd0e0c6a94b9438ff0bff7ec9b8bafc";

async function connect() {
  try {
    await mongoose.connect(
      "mongodb+srv://dilkashbudtech:dilkashbudtech@upmyranks.dxismty.mongodb.net/upmyranks?retryWrites=true&w=majority"
      // {
      //   // useNewUrlParser: true,
      //   ssl: true,
      //   tlsAllowInvalidCertificates: false,
      //   tlsCAFile: path.join(__dirname, "rds-combined-ca-bundle.pem"),
      // }
    );

    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

async function deleteImagesFromS3(keysToDelete) {
  try {
    console.log("s3 files to delete", keysToDelete);
    if (keysToDelete.length === 0) return;
    // Set up parameters for the deleteObjects operation
    const deleteParams = {
      Bucket: bucketName,
      Delete: {
        Objects: keysToDelete.map((Key) => ({ Key })),
      },
    };

    // Perform the deleteObjects operation
    const deleteResult = await s3.deleteObjects(deleteParams).promise();

    // Log deleted objects
    console.log("Deleted objects:", deleteResult.Deleted);
    console.log("Objects deleted from S3 successfully.");
  } catch (error) {
    console.error("Error deleting objects from S3:", error.message);
  }
}

exports.handler = async (event) => {
  let collection = await mongoose.connection.collection("getgamedataapis");
  let connectionId;
  const fileName = `DocFile_${uuid.v4()}`;
  const docxFilePath = path.join("/tmp", `${fileName}.docx`);
  const htmlPath = path.join("/tmp", `${fileName}.html`);
  const pandocCommand = "pandoc/bin/pandoc";

  try {
    console.log("connecting to mongodb.....");
    await connect();
    // const record = event.Records[0];
    const bucket = "allassestsupmyranks";
    const key = event.s3Path;
    const errors = [];

    // Use the S3 getObject method to download the file content
    const params = {
      Bucket: bucket,
      Key: key,
    };

    console.log("connecting to s3");
    const response = await s3.getObject(params).promise();
    console.log("get file from s3 ✅");
    const docxContent = response.Body;
    fs.writeFileSync(docxFilePath, docxContent);
    console.log(`File downloaded and saved to ${docxFilePath}`);
    const command = `${pandocCommand} "${docxFilePath}" -o ${htmlPath} --extract-media=/tmp/media`;

    const { stdout, stderr } = await exec(command);

    if (stderr) {
      const warningRegex = /\[WARNING\]/g;
      const hasWarnings = stderr.match(warningRegex);

      if (hasWarnings) {
        // Handle warnings
        console.warn("Warnings during pandoc execution:", stderr, stdout);
      } else {
        connectionId = await sendSocketMessage(
          connectionId,
          event.processingId,
          {
            message: `Server Error`,
            isError: true,
            finished: true,
          }
        );
        console.log("Error during pandoc execution:", stderr, stdout);
        return;
      }
    }

    const htmlContent = fs.readFileSync(htmlPath, "utf-8");

    console.log("HTML Content:", htmlContent);

    // Load HTML content using Cheerio
    const $ = cheerio.load(htmlContent);
    const questions = [];
    const tableElements = $("table:not(table table)");
    const totalQuestionCount = tableElements.length;
    // check for the number of questions

    // Loop through table
    for (let index = 0; index < tableElements.length; index++) {
      // console.log("table element:", index + 1);
      const questionObject = {
        processingId: event.processingId,
        qrCodeId: event.qrCodeId,
        mainInstruction: event.mainInstruction,
        mainDescription: event.mainDescription,
        courseId: event.courseId,
        subjectId: event.subjectId,
        chapterId: event.chapterId,
      };
      if (event.topicId) questionObject.topicId = event.topicId;
      if (event.subTopicId) questionObject.subTopicId = event.subTopicId;
      const s3Urls = [];
      let hasError = false;
      const rowElements = $(tableElements[index]).find("tr:not(tr tr)");
      const getQuestion = async (rowElements) => {
        const rowElement = rowElements[1];
        let tableColumn;
        if ($(rowElement).find("td").length !== 0) {
          tableColumn = "td";
        } else if ($(rowElement).find("th").length !== 0) {
          tableColumn = "th";
        }
        const imageElements = $(rowElement)
          .find(`${tableColumn}:first-child`)
          .find("img");
        for (let imgIndex = 0; imgIndex < imageElements.length; imgIndex++) {
          const imgElement = imageElements[imgIndex];
          let src = "default-src";
          src = $(imgElement).attr("src");
          src = await uploadPNGToS3(src);
          // src = "no-src";
          s3Urls.push(new URL(src).pathname.substring(1));
          $(imgElement).attr("src", src);
        }

        const question = $(rowElement)
          .find(`${tableColumn}:first-child`)
          .html();
        return question;
      };
      const question = await getQuestion(rowElements);
      //Loop through rows of the table
      const tableRowsLenght = rowElements.length;
      for (let rowIndex = 0; rowIndex < tableRowsLenght; rowIndex++) {
        // console.log("row element:", rowIndex + 1);
        const rowElement = rowElements[rowIndex];
        let tableColumn;
        if ($(rowElement).find("td").length !== 0) {
          tableColumn = "td";
        } else if ($(rowElement).find("th").length !== 0) {
          tableColumn = "th";
        }
        if (
          $(rowElement).find("td").length === 0 &&
          $(rowElement).find("th").length === 0
        ) {
          errors.push({
            message: `No coloumn found - table format is wrong - table number ${
              index + 1
            }`,
            questionNumber: index + 1,
            question: "",
          });

          console.log("No coloumn found");
          await deleteImagesFromS3(s3Urls);
          hasError = true;
          break;
        }

        if (rowIndex === 0) {
          let questionNo = $(rowElement)
            .find(`${tableColumn}:first-child`)

            .text();
          console.log("test:questionNo", questionNo);
          questionNo = parseInt(questionNo);
          if (isNaN(questionNo)) {
            errors.push({
              message: `Question No. should be a number`,
              questionNumber: index + 1,
              question: question,
            });
            console.log(`Question No. should be a number`);
            await deleteImagesFromS3(s3Urls);
            hasError = true;
            break;
          }
          questionObject.questionNo = questionNo;
        }
        if (rowIndex === 1) {
          let question = $(rowElement)
            .find(`${tableColumn}:first-child`)
            .html();
          console.log("test:question", question);
          questionObject.question = question;
        }

        if (rowIndex > 1 && rowIndex < tableRowsLenght - 2) {
          questionObject.options = questionObject.options ?? [];
          const imageElements = $(rowElement)
            .find(`${tableColumn}:nth-child(2)`)

            .find("img");
          for (let imgIndex = 0; imgIndex < imageElements.length; imgIndex++) {
            const imgElement = imageElements[imgIndex];
            let src = $(imgElement).attr("src");
            src = await uploadPNGToS3(src);
            // src = "no-src";
            s3Urls.push(new URL(src).pathname.substring(1));
            $(imgElement).attr("src", src);
          }
          const option = $(rowElement)
            .find(`${tableColumn}:nth-child(2)`)
            .html();
          console.log("test:option", option);
          questionObject.options.push({
            option: option,
            number: rowIndex - 2,
          });
        }
        if (rowIndex === tableRowsLenght - 2) {
          let correctOption = $(rowElement)
            .find(`${tableColumn}:first-child`)
            .text()
            .trim();
          console.log("test:correctOption", correctOption);
          correctOption = parseInt(correctOption);
          if (isNaN(correctOption)) {
            errors.push({
              message: `Answer should be the option number`,
              questionNumber: index + 1,
              question: question,
            });
            console.log(`Answer should be the option number`);
            await deleteImagesFromS3(s3Urls);
            hasError = true;
            break;
          }

          questionObject.answer = correctOption - 1;
        }
        if (rowIndex === tableRowsLenght - 1) {
          const imageElements = $(rowElement)
            .find(`${tableColumn}:first-child`)
            .find("img");
          for (let imgIndex = 0; imgIndex < imageElements.length; imgIndex++) {
            const imgElement = imageElements[imgIndex];
            let src = $(imgElement).attr("src");
            src = await uploadPNGToS3(src);
            // src = "no-src";
            s3Urls.push(new URL(src).pathname.substring(1));
            $(imgElement).attr("src", src);
          }
          const answer = $(rowElement)
            .find(`${tableColumn}:first-child`)
            .html();
          console.log("test:ansserdk", answer);
          questionObject.solution = answer;
        }
      }

      if (hasError) {
        console.log("has error for table ", index + 1);
        continue;
      }
      console.log("question object", questionObject);
      questions.push(questionObject);
      if (index !== totalQuestionCount - 1)
        connectionId = await sendSocketMessage(
          connectionId,
          event.processingId,
          {
            progress: parseInt(((index + 1) * 100) / totalQuestionCount),
          }
        );
    }
    console.log("data to add to db");

    if (questions.length !== 0) {
      const getGameDataGeneric = await collection.insertOne({
        type: 10,
        qrCodeId: event.qrCodeId,
        callBackURL: `https://hkg3v1s22i.execute-api.ap-south-1.amazonaws.com/prod/question_management/qr-questions/${event.qrCodeId}`,
      });
      console.log(getGameDataGeneric);
      await QRQuestion.insertMany(questions).then((err, data) => {
        if (err) {
          console.log("BULUPLOADERRORUPLOAD", err);
        }
        console.log("BULUPLOADDATAUPLOAD", data);
      });
      console.log("data added to the db", event.processingId, event);
      await updateDocUploadStatus({
        processingId: event.processingId,
        filename: event.filename,
      });
      console.log("updated upload status in the data in dynamo");
    } else {
      // await sendSocketMessage(connectionId, event.processingId, {
      //   message: "No questions to upload to DB",
      //   finished: true,
      // });
    }
    let s3Location;
    if (errors.length !== 0) {
      const errorSheet = createExcel(errors);
      s3Location = await uploadToS3(errorSheet, event.processingId);

      await updateResponseDoc({
        processingId: event.processingId,
        filename: event.filename,
        path: s3Location,
      });
    }
    await sendSocketMessage(connectionId, event.processingId, {
      uploadedCount: questions.length,
      notUploadedCount: totalQuestionCount - questions.length,
      filePath: errors.length === 0 ? null : s3Location,
      finished: true,
      progress: 100,
    });
  } catch (error) {
    console.error("Server Error:", error);
    sendSocketMessage(connectionId, event.processingId, {
      message: error.customError ? error.message : "Server Error",
      finished: true,
      isError: true,
    });
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Server Error", error: error }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "File uploaded successfully" }),
  };
};

async function sendMessageToConnection(connectionId, message) {
  try {
    await apiGateway
      .postToConnection({
        ConnectionId: connectionId,
        Data: message,
      })
      .promise();
  } catch (error) {
    console.error("Error sending message to connection:", error);
    throw error;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const updateDocUploadStatus = async (data) => {
  try {
    const updateUploadParams = {
      TableName: "QuestionDocs", // replace with your table name
      Key: {
        processingId: data.processingId, // replace with the partition key value
        filename: data.filename,
      },
      UpdateExpression: "SET #uploaded = :uploadedValue",
      ExpressionAttributeNames: {
        "#uploaded": "uploaded",
      },
      ExpressionAttributeValues: {
        ":uploadedValue": true, // replace with the new value for "uploaded"
      },
      ReturnValues: "NONE",
    };
    await dynamoDB.update(updateUploadParams).promise();
  } catch (error) {
    console.log("error in updateDocUploadStatus: ", error);
    throw error;
  }
};

const updateResponseDoc = async (data) => {
  try {
    const updateUploadParams = {
      TableName: "QuestionDocs", // replace with your table name
      Key: {
        processingId: data.processingId, // replace with the partition key value
        filename: data.filename,
      },
      UpdateExpression: "SET #uploaded = :uploadedValue",
      ExpressionAttributeNames: {
        "#uploaded": "responseDoc",
      },
      ExpressionAttributeValues: {
        ":uploadedValue": data.path, // replace with the new value for "uploaded"
      },
      ReturnValues: "NONE",
    };
    await dynamoDB.update(updateUploadParams).promise();
  } catch (error) {
    console.log("error in updateResponseDoc: ", error);
    throw error;
  }
};

const sendSocketMessage = async (connectionId, processingId, message) => {
  console.log("in sendSocketMessage");
  try {
    // Try querying DynamoDB multiple times with a delay
    const maxRetries = 4;
    let retryCount = 0;

    if (!connectionId) {
      console.log("No connectionId: retryCount", retryCount);
      while (retryCount < maxRetries) {
        // DynamoDB parameters for querying the item based on the index ID
        const params = {
          TableName: "SocketConnection",
          IndexName: "id-index", // Replace with the actual index name
          KeyConditionExpression: "id = :id",
          ExpressionAttributeValues: {
            ":id": processingId,
          },
        };

        // Query data from DynamoDB using Document Client
        const queryResult = await dynamoDB.query(params).promise();

        // Check if a connection ID is found
        if (queryResult.Items && queryResult.Items.length > 0) {
          connectionId = queryResult.Items[0].connectionId;
          break; // Exit the loop if connection ID is found
        }

        // Wait for 30 seconds before retrying
        await sleep(30000);
        retryCount++;
      }
    }

    if (connectionId) {
      // Send a message to the connection
      await sendMessageToConnection(connectionId, JSON.stringify(message));
      console.log("Socket message sent");
    } else {
      console.log(
        "Socket connection not available after multiple attempts for processingId: ",
        processingId
      );
    }
    return connectionId;
  } catch (error) {
    console.error("Error sending socket message:", error);
  }
};

function checkBase64Format(base64String) {
  const isPNG = base64String.startsWith("data:image/png;base64,");
  const isWMF = base64String.startsWith("data:image/x-wmf;base64,");
  const isWMFFile =
    base64String.startsWith("/tmp/") && base64String.endsWith(".wmf");
  const isEMFFile =
    base64String.startsWith("/tmp/") && base64String.endsWith(".emf");
  const isPNGFile =
    base64String.startsWith("/tmp/") && base64String.endsWith(".png");
  return { isPNG, isWMF, isWMFFile, isPNGFile, isEMFFile };
}

const uploadPNGToS3 = async (file, s3Prefix) => {
  try {
    const { isPNG, isWMF, isWMFFile, isPNGFile, isEMFFile } =
      checkBase64Format(file);

    const fileName = uuid.v4();
    const TEMP_WMF_FILE = isWMFFile
      ? file
      : path.join("/tmp", `${fileName}.wmf`);
    // const TEMP_WEBP_FILE = path.join("/tmp", `${fileName}.webp`);
    const TEMP_PNG_FILE = isPNGFile
      ? file
      : path.join("/tmp", `${fileName}.png`);

    if (isPNG || isPNGFile) {
      if (!isPNGFile) {
        file = file.replace(/^data:image\/png;base64,/, "");
        const binaryBuffer = Buffer.from(file, "base64");
        fs.writeFileSync(TEMP_PNG_FILE, binaryBuffer, "binary");
      }
    } else if (isWMF || isWMFFile || isEMFFile) {
      if (isWMF) {
        // Save the buffer as a WMF file
        file = file.replace(/^data:image\/x-wmf;base64,/, "");
        const binaryBuffer = Buffer.from(file, "base64");
        fs.writeFileSync(TEMP_WMF_FILE, binaryBuffer, "binary");
      }

      const formData = new FormData();
      formData.append("target_format", "png");
      formData.append(
        "source_file",
        await fs.createReadStream(isEMFFile ? file : TEMP_WMF_FILE)
      );

      try {
        // create the file conversion
        const jobCreated = await axios.post(`${ZAMZAR_API}jobs/`, formData, {
          headers: {
            Authorization: `Basic ${Buffer.from(`${ZAMZAR_API_KEY}:`).toString(
              "base64"
            )}`,
          },
        });

        console.log("SUCCESS! Conversion job started:", jobCreated.data);

        // Poll for job status until it's successful
        do {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second
          const jobId = jobCreated.data.id;
          const apiUrl = `${ZAMZAR_API}jobs/${jobId}`;
          jobStatus = await axios.get(apiUrl, {
            headers: {
              Authorization: `Basic ${Buffer.from(
                `${ZAMZAR_API_KEY}:`
              ).toString("base64")}`,
            },
          });
          console.log("Job Status", jobStatus.data.status);
        } while (jobStatus.data.status !== "successful");

        // Download the file
        const targetFileId = jobStatus.data.target_files[0].id;
        const response = await axios.get(
          `${ZAMZAR_API}files/${targetFileId}/content`,
          {
            responseType: "stream",
            headers: {
              Authorization: `Basic ${Buffer.from(
                `${ZAMZAR_API_KEY}:`
              ).toString("base64")}`,
            },
          }
        );
        console.log("File downloaded from zamzar");
        const writeStream = fs.createWriteStream(TEMP_PNG_FILE);
        response.data.pipe(writeStream);

        await new Promise((resolve, reject) => {
          writeStream.on("finish", resolve);
          writeStream.on("error", reject);
        });
        console.log("File added in the local system");
      } catch (error) {
        console.error("Error while doing conversion", error);
        throw error;
      }
      // try {
      //   // Convert image using sharp
      //   // await sharp(TEMP_WEBP_FILE)
      //   //   .webp({ quality: 100 })
      //   //   .toFile(TEMP_PNG_FILE);
      //   // console.log("Image converted to png successfully");
      //   // fs.unlinkSync(TEMP_WEBP_FILE);
      //   if (await fs.promises.access(TEMP_WMF_FILE))
      //     fs.unlinkSync(TEMP_WMF_FILE);
      // } catch (error) {
      //   console.log("Error on deleting temp file ", error);
      //   throw error;
      // }
    } else {
      console.log(
        "Error in uploadPNGToS3: The image is neither png nor wmf",
        file
      );
      throw { message: "The image is neither png nor wmf", customError: true };
    }

    try {
      // Read the converted image data
      const convertedImageData = fs.createReadStream(TEMP_PNG_FILE);

      const randomUUID = uuid.v4();
      const timestamp = new Date().getTime().toString();
      // Upload converted image to S3
      const uploadParams = {
        Bucket: bucketName,
        Key: "question-images/" + `${timestamp}_${randomUUID}` + ".png",
        Body: convertedImageData,
      };

      const uploadResult = await s3.upload(uploadParams).promise();
      console.log("Image uploaded to S3:", uploadResult.Location);

      // Clean up the temporary converted image file
      // fs.unlinkSync(TEMP_PNG_FILE);
      // console.log("Temporary converted image file deleted");
      return uploadResult.Location.replace(
        "jsonimages.s3.ap-south-1.amazonaws.com",
        bucketDomainName
      );
    } catch (error) {
      console.error("Error in s3 upload:", error);
      throw error;
    }
  } catch (error) {
    console.log("Error in uploadPNGToS3: ", error);
    throw error;
  }
};

function createExcel(errors) {
  for (const error of errors) {
    error.question = error.question.replace(/<\/?p>/g, " ");
  }
  const workbook = xlsx.utils.book_new();

  // Create an empty worksheet
  const worksheet = xlsx.utils.aoa_to_sheet([]);

  xlsx.utils.sheet_add_aoa(
    worksheet,
    [["Message", "Question No", "Question"]],
    {
      origin: -1,
    }
  );

  // Add data to the worksheet
  xlsx.utils.sheet_add_json(worksheet, errors, {
    skipHeader: true,
    origin: -1,
  });

  xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet 1");

  // Save the workbook to a buffer
  const buffer = xlsx.write(workbook, { bookType: "xlsx", type: "buffer" });

  return buffer;
}

async function uploadToS3(buffer, filename) {
  const params = {
    Bucket: "allassestsupmyranks",
    Key: `question-docs/response-docs/${filename}`, // filename will the processingId
    Body: buffer,
    ContentType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };

  const result = await s3.upload(params).promise();

  return result.Location;
}
