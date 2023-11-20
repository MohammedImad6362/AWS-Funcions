// TODO: Handle Multiple MCQ Any and Number-Range
const fs = require("fs");
const os = require("os");
const path = require("path");
const mammoth = require("mammoth");
const cheerio = require("cheerio");
const axios = require("axios");
const FormData = require("form-data");
const AWS = require("aws-sdk");
const sharp = require("sharp");
const uuid = require("uuid");
// const multipart = require("lambda-multipart-parser");
const { default: mongoose } = require("mongoose");
const { DocQuestion } = require("./docQuestionModel");
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

const ZAMZAR_API = "https://sandbox.zamzar.com/v1/";
const ZAMZAR_API_KEY = "6a3e1b8eb2fa17c82f8c10e9875073ac8cab3211";

const questionTypes = [
  "mcq",
  "number",
  "assertion",
  "fill-blank",
  "multiple_mcq",
  "multiple_mcq_any",
  "matrix",
  "tf",
  "number-range",
];

async function connect() {
  try {
    await mongoose.connect(
      "mongodb://upmyranks:upmyranks@docdb-2023-04-09-13-10-41.cgaao9qpsg6i.ap-south-1.docdb.amazonaws.com:27017/upmyranks?ssl=true&retryWrites=false",
      {
        // useNewUrlParser: true,
        ssl: true,
        tlsAllowInvalidCertificates: false,
        tlsCAFile: path.join(__dirname, "rds-combined-ca-bundle.pem"),
      }
    );
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

exports.handler = async (event) => {
  // const formData = await multipart.parse(event, true); // true to include binary data

  // if (!formData.files || formData.files.length === 0) {
  //   return {
  //     statusCode: 400,
  //     body: JSON.stringify({ message: "No file uploaded" }),
  //   };
  // }

  // const uploadedFile = formData.files[0];

  // if (!uploadedFile.filename.toLowerCase().endsWith(".docx")) {
  //   return {
  //     statusCode: 400,
  //     body: JSON.stringify({
  //       message: "Uploaded file must be a docx file",
  //     }),
  //   };
  // }

  // const baseTempPath = path.join(os.tmpdir(), "questions");

  try {
    // console.log("connecting to mongodb.....");
    // await connect();
    // // const record = event.Records[0];
    // const bucket = "allassestsupmyranks";
    // const key = event.s3Path;

    // // Use the S3 getObject method to download the file content
    // const params = {
    //   Bucket: bucket,
    //   Key: key,
    // };

    // console.log("connecting to s3");
    // const response = await s3.getObject(params).promise();
    // console.log("get file from s3 ✅");
    // const docxContent = response.Body;
    // const result = await mammoth.convertToHtml({
    //   buffer: docxContent,
    // });
    // const htmlContent = result;

    // // Load HTML content using Cheerio
    // const $ = cheerio.load(htmlContent.value);
    // const questions = [];
    // const tableElements = $("table");
    // // Loop through table
    // for (let index = 0; index < tableElements.length; index++) {
    //   // console.log("table element:", index + 1);
    //   const questionObject = {
    //     external: true,
    //     instituteId: event.instituteId,
    //     branchId: event.branchId,
    //     teacherId: event.teacherId,
    //     courseId: event.courseId,
    //     topicId: event.topicId,
    //     sharable: event.sharable,
    //   };
    //   if (event.subTopicId) questionObject["subTopicId"] = event.subTopicId;
    //   const rowElements = $(tableElements[index]).find("tr");
    //   //Loop through rows of the table
    //   const tableRowsLenght = rowElements.length;
    //   for (let rowIndex = 0; rowIndex < tableRowsLenght; rowIndex++) {
    //     // console.log("row element:", rowIndex + 1);
    //     const rowElement = rowElements[rowIndex];
    //     let tableColumn;
    //     if ($(rowElement).find("td").length !== 0) {
    //       tableColumn = "td";
    //     } else if ($(rowElement).find("th").length !== 0) {
    //       tableColumn = "th";
    //     }
    //     if (
    //       $(rowElement).find("td").length === 0 &&
    //       $(rowElement).find("th").length === 0
    //     ) {
    //       throw "No coloumn found";
    //     }
    //     // if (rowIndex === 0) {
    //     //   // do validation to check if it's a valid id
    //     //   const subject = $(rowElement)
    //     //     .find(`${tableColumn}:first-child`)
    //     //     .find("p")
    //     //     .text();
    //     //   questionObject.subject = subject;
    //     // }
    //     // if (rowIndex === 1) {
    //     //   // do validation to check if it's a valid id
    //     //   const chapter = $(rowElement)
    //     //     .find(`${tableColumn}:first-child`)
    //     //     .find("p")
    //     //     .text();
    //     //   questionObject.chapter = chapter;
    //     // }
    //     // if (rowIndex === 2) {
    //     //   // do validation to check if it's a valid id
    //     //   const topic = $(rowElement)
    //     //     .find(`${tableColumn}:first-child`)
    //     //     .find("p")
    //     //     .text();
    //     //   questionObject.topic = topic;
    //     // }
    //     if (rowIndex === 0) {
    //       const difficulty = $(rowElement)
    //         .find(`${tableColumn}:first-child`)
    //         .find("p")
    //         .text();
    //       questionObject.difficulty = difficulty;
    //     }
    //     if (rowIndex === 1) {
    //       // do validation to check if it's a valid id
    //       const type = $(rowElement)
    //         .find(`${tableColumn}:first-child`)
    //         .find("p")
    //         .text();
    //       if (!questionTypes.includes(type)) {
    //         throw `Unknown question type: ${type}`;
    //       }
    //       questionObject.type = type;
    //     }
    //     if (rowIndex === 2) {
    //       const imageElements = $(rowElement)
    //         .find(`${tableColumn}:first-child`)
    //         .find("p")
    //         .find("img");
    //       for (let imgIndex = 0; imgIndex < imageElements.length; imgIndex++) {
    //         const imgElement = imageElements[imgIndex];
    //         let src = "default-src";
    //         src = $(imgElement)
    //           .attr("src")
    //           .replace(/^data:image\/x-wmf;base64,/, "");
    //         src = await uploadPNGToS3(src);
    //         // src = "no-src";
    //         $(imgElement).attr("src", src);
    //       }

    //       const question = $(rowElement)
    //         .find(`${tableColumn}:first-child`)
    //         .html();
    //       questionObject.question = { text: question };
    //     }

    //     if (rowIndex > 2 && rowIndex < tableRowsLenght - 2) {
    //       questionObject.options = questionObject.options ?? [];
    //       if (questionObject.type === "matrix") {
    //         // const firstColumn = questionObject.options["firstColumn"];
    //         // const secondColumn = questionObject.options["secondColumn"];
    //         // // the options are in 2nd and 4th columns
    //         // for (let column of [2, 4]) {
    //         //   const imageElements = $(rowElement)
    //         //     .find(`${tableColumn}:nth-child(${column})`)
    //         //     .find("p")
    //         //     .find("img");
    //         //   for (
    //         //     let imgIndex = 0;
    //         //     imgIndex < imageElements.length;
    //         //     imgIndex++
    //         //   ) {
    //         //     const imgElement = imageElements[imgIndex];
    //         //     let src = $(imgElement)
    //         //       .attr("src")
    //         //       .replace(/^data:image\/x-wmf;base64,/, "");
    //         // src = await uploadPNGToS3(src);
    //         // src = "no-src";
    //         //     $(imgElement).attr("src", src);
    //         //   }
    //         //   const option = $(rowElement)
    //         //     .find(`${tableColumn}:nth-child(${column})`)
    //         //     .html();
    //         //   if (column === 2)
    //         //     questionObject.options["firstColumn"] =
    //         //       firstColumn !== undefined
    //         //         ? {
    //         //             ...firstColumn,
    //         //             ...{ [`option${rowIndex - 5}`]: option },
    //         //           }
    //         //         : { [`option${rowIndex - 5}`]: option };
    //         //   else
    //         //     questionObject.options["secondColumn"] =
    //         //       secondColumn !== undefined
    //         //         ? {
    //         //             ...secondColumn,
    //         //             ...{ [`option${rowIndex - 5}`]: option },
    //         //           }
    //         //         : { [`option${rowIndex - 5}`]: option };
    //         // }
    //       } else {
    //         const imageElements = $(rowElement)
    //           .find(`${tableColumn}:nth-child(2)`)
    //           .find("p")
    //           .find("img");
    //         for (
    //           let imgIndex = 0;
    //           imgIndex < imageElements.length;
    //           imgIndex++
    //         ) {
    //           const imgElement = imageElements[imgIndex];
    //           let src = $(imgElement)
    //             .attr("src")
    //             .replace(/^data:image\/x-wmf;base64,/, "");
    //           src = await uploadPNGToS3(src);
    //           // src = "no-src";
    //           $(imgElement).attr("src", src);
    //         }
    //         const option = $(rowElement)
    //           .find(`${tableColumn}:nth-child(2)`)
    //           .html();
    //         questionObject.options.push({
    //           d: { text: option },
    //           v: rowIndex - 3,
    //         });
    //       }
    //     }
    //     if (rowIndex === tableRowsLenght - 2) {
    //       let correctOption = $(rowElement)
    //         .find(`${tableColumn}:first-child`)
    //         .find("p")
    //         .text()
    //         .trim();
    //       if (["mcq", "assertion"].includes(questionObject.type)) {
    //         correctOption = parseInt(correctOption);
    //         if (isNaN(correctOption)) throw "Answer option not a number";

    //         questionObject.answer = correctOption - 1;
    //       } else if (
    //         ["multiple_mcq", "multiple_mcq_any", "number-range"].includes(
    //           questionObject.type
    //         )
    //       ) {
    //         let options = correctOption.split(",").map((option) => {
    //           let numberOption = parseInt(option.trim());
    //           if (isNaN(numberOption))
    //             throw "Answer option not a number in multiple_mcq";
    //           return numberOption;
    //         });
    //         questionObject.answer = options;
    //       } else if (questionObject.type === "number") {
    //         const numbersArray = correctOption.match(/\d+/g);

    //         if (numbersArray) {
    //           // Convert the array of strings to an array of numbers
    //           const numbersOnly = numbersArray.map(Number);
    //           questionObject.answer = numbersOnly[0];
    //         } else {
    //           throw "No number found in answer, for number type question";
    //         }
    //       } else if (questionObject.type === "tf") {
    //         questionObject.answer = correctOption.toLowerCase() === true;
    //       } else if (questionObject.type === "matrix") {
    //         const optionArray = [];
    //         correctOption.split(",").forEach((el, elIndex) => {
    //           const spEl = el.split(":"); // [a,ab]
    //           let position = parseInt(spEl[0].trim());
    //           if (isNaN(position)) throw "Answer option not a number in matrix";

    //           const chars = spEl[1].trim();
    //           const charArray = [];
    //           for (let char of chars) {
    //             char = parseInt(char);
    //             if (isNaN(char)) throw "Answer option not a number in matrix";
    //             charArray.push(char);
    //           }
    //           optionArray[position - 1] = charArray;
    //         });

    //         questionObject.answer = optionArray;
    //       } else if (questionObject.type === "fill-blank") {
    //         questionObject.answer = correctOption;
    //       } else {
    //         throw `wrong answer format for type:${questionObject.type}`;
    //       }
    //     }
    //     if (rowIndex === tableRowsLenght - 1) {
    //       const imageElements = $(rowElement)
    //         .find(`${tableColumn}:first-child`)
    //         .find("p")
    //         .find("img");
    //       for (let imgIndex = 0; imgIndex < imageElements.length; imgIndex++) {
    //         const imgElement = imageElements[imgIndex];
    //         let src = $(imgElement)
    //           .attr("src")
    //           .replace(/^data:image\/x-wmf;base64,/, "");
    //         src = await uploadPNGToS3(src);
    //         // src = "no-src";
    //         $(imgElement).attr("src", src);
    //       }
    //       const answer = $(rowElement)
    //         .find(`${tableColumn}:first-child`)
    //         .html();
    //       questionObject.solution = { text: answer };
    //     }
    //   }
    //   console.log("quston object", questionObject);
    //   questions.push(questionObject);
    // }
    // console.log("data to add to db");
    // await DocQuestion.insertMany(questions);
    // console.log("data added to the db", event.processingId, event);
    await updateDocUploadStatus({
      processingId: event.processingId,
      filename: event.filename,
    });
    console.log("updated the data in dynamo");
    await sendSocketMessage(event.processingId);
  } catch (error) {
    console.error("Error:", error);
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

const sendSocketMessage = async (processingId) => {
  try {
    // Try querying DynamoDB multiple times with a delay
    const maxRetries = 4;
    let retryCount = 0;
    let connectionId;

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

    if (connectionId) {
      // Send a message to the connection
      await sendMessageToConnection(
        connectionId,
        JSON.stringify({ message: "Uploaded file data to db" })
      );
      console.log("Socket message sent");
    } else {
      console.log(
        "Socket connection not available after multiple attempts for processingId: ",
        processingId
      );
    }
  } catch (error) {
    console.error("Error sending socket message:", error);
  }
};

// const uploadPNGToS3 = async (file) => {
//   const fileName = uuid.v4();
//   const TEMP_WMF_FILE = path.join("/tmp", `${fileName}.wmf`);
//   const TEMP_WEBP_FILE = path.join("/tmp", `${fileName}.webp`);
//   const TEMP_PNG_FILE = path.join("/tmp", `${fileName}.png`);
//   const binaryBuffer = Buffer.from(file, "base64");

//   // Save the buffer as a WMF file
//   fs.writeFileSync(TEMP_WMF_FILE, binaryBuffer, "binary");

//   const formData = new FormData();
//   formData.append("target_format", "webp");
//   formData.append("source_file", await fs.createReadStream(TEMP_WMF_FILE));

//   try {
//     // create the file conversion
//     const jobCreated = await axios.post(`${ZAMZAR_API}jobs/`, formData, {
//       headers: {
//         Authorization: `Basic ${Buffer.from(`${ZAMZAR_API_KEY}:`).toString(
//           "base64"
//         )}`,
//       },
//     });

//     console.log("SUCCESS! Conversion job started:", jobCreated.data);

//     // Poll for job status until it's successful
//     do {
//       await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second
//       const jobId = jobCreated.data.id;
//       const apiUrl = `${ZAMZAR_API}jobs/${jobId}`;
//       jobStatus = await axios.get(apiUrl, {
//         headers: {
//           Authorization: `Basic ${Buffer.from(`${ZAMZAR_API_KEY}:`).toString(
//             "base64"
//           )}`,
//         },
//       });
//       console.log("Job Status", jobStatus.data.status);
//     } while (jobStatus.data.status !== "successful");

//     // Download the file
//     const targetFileId = jobStatus.data.target_files[0].id;
//     const response = await axios.get(
//       `${ZAMZAR_API}files/${targetFileId}/content`,
//       {
//         responseType: "stream",
//         headers: {
//           Authorization: `Basic ${Buffer.from(`${ZAMZAR_API_KEY}:`).toString(
//             "base64"
//           )}`,
//         },
//       }
//     );
//     console.log("File downloaded from zamzar");
//     const writeStream = fs.createWriteStream(TEMP_WEBP_FILE);
//     response.data.pipe(writeStream);

//     await new Promise((resolve, reject) => {
//       writeStream.on("finish", resolve);
//       writeStream.on("error", reject);
//     });
//     console.log("File added in the local system");
//   } catch (error) {
//     console.error("Error while doing conversion", error);
//   }

//   try {
//     // Convert image using sharp
//     await sharp(TEMP_WEBP_FILE).webp({ quality: 100 }).toFile(TEMP_PNG_FILE);
//     console.log("Image converted to png successfully");

//     // Read the converted image data
//     const convertedImageData = fs.createReadStream(TEMP_PNG_FILE);

//     const randomUUID = uuid.v4();
//     const timestamp = new Date().getTime().toString();
//     // Upload converted image to S3
//     const uploadParams = {
//       Bucket: bucketName,
//       Key: "question-images/" + `${timestamp}_${randomUUID}` + ".png",
//       Body: convertedImageData,
//     };

//     const uploadResult = await s3.upload(uploadParams).promise();
//     console.log("Image uploaded to S3:", uploadResult.Location);

//     // Clean up the temporary converted image file
//     fs.unlinkSync(TEMP_PNG_FILE);
//     fs.unlinkSync(TEMP_WEBP_FILE);
//     fs.unlinkSync(TEMP_WMF_FILE);
//     console.log("Temporary converted image file deleted");
//     return uploadResult.Location;
//   } catch (error) {
//     console.error("Error:", error);
//   }
// };
