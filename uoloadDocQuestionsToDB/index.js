// TODO: Handle Multiple MCQ Any and Number-Range
const fs = require("fs");
const os = require("os");
const path = require("path");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const cheerio = require("cheerio");
const axios = require("axios");
const FormData = require("form-data");
const AWS = require("aws-sdk");
const sharp = require("sharp");
const uuid = require("uuid");
const he = require("he");
const xlsx = require("xlsx");
// const multipart = require("lambda-multipart-parser");
const { default: mongoose } = require("mongoose");
const { getModelWithCollection } = require("./docQuestionModel");
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

const courseCollectionMap = [
  {
    courseIds: [
      "5f2515552fb05f3e77b5a0c9",
      "5f2127321da6307b6017d238",
      "5f22d358f5e6de58f69cdbba",
    ],
    collection: "olympiad",
  },
  {
    courseIds: ["5c8a21114678cd2062dc2d34"],
    collection: "ssc",
  },
  {
    courseIds: ["5de8f167f2109b7c7646f697"],
    collection: "upsc",
  },
  {
    courseIds: [
      "5e12bc386ed15e08c72f429b",
      "5d14b391429e7911c890ca4b",
      "5d1f3ea6d118dc2f7fa1ea1c",
    ],
    collection: "neet_jee",
  },
  {
    courseIds: [
      "5de7a251d729d0042308df72",
      "5e27f872e782332de9127730",
      "5de796dbd729d0042308df0f",
    ],
    collection: "neet_jee_foundation",
  },
  {
    courseIds: [
      "5eb640de32fbdd39436e0804",
      "5eb6421f32fbdd39436e083e",
      "5eb643413204cc4ccbb45110",
      "5eb6444232fbdd39436e0878",
      "5eb6453f32fbdd39436e08d1",
      "5eb648ab32fbdd39436e094a",
      "5eb64ce33204cc4ccbb451bd",
      "5eb64cee3204cc4ccbb451be",
      "5edb7daa8116a8415100ffc4",
      "5edb7ebd8116a84151010001",
    ],
    collection: "icse",
  },
  {
    courseIds: ["5ba38ddb27bee8026b0307db"],
    collection: "ibps",
  },
  {
    courseIds: [
      "5e95fa77d0e69d4e536267b4",
      "5e985f364e70da2c08cb54e0",
      "5e9db235f722de4b06ac7274",
      "5ea340c579c9f40f067e144d",
      "5ea340ce0d30690e7a1ef0e2",
      "5ea475c678e7e1098c958783",
      "5ea475d0faa26608ee611626",
      "5ea475e178e7e1098c958784",
      "5ea475f0faa26608ee611627",
    ],
    collection: "cbse",
  },
];

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
  "descriptive",
];
const difficultyLevels = [
  "very_easy",
  "easy",
  "medium",
  "difficult",
  "very_difficult",
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
  let connectionId;
  const fileName = `DocFile_${uuid.v4()}`;
  const docxFilePath = path.join("/tmp", `${fileName}.docx`);
  const htmlPath = path.join("/tmp", `${fileName}.html`);
  const pandocCommand = "pandoc/bin/pandoc";
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
    console.log("connecting to mongodb.....");
    await connect();
    // const record = event.Records[0];
    const bucket = "allassestsupmyranks";
    const key = event.s3Path;
    let validationError = [];
    const errors = [];

    const collectionName = courseCollectionMap.find((item) =>
      item.courseIds.includes(event.courseId)
    )?.collection;
    if (!collectionName)
      throw {
        message: `No collection for the courseId: ${event.courseId}`,
        customError: true,
      };

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
        console.warn("Warnings during pandoc execution:", stderr);
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
        console.log("Error during pandoc execution:", stderr);
        return;
      }
    }

    const htmlContent = fs.readFileSync(htmlPath, "utf-8");

    console.log("HTML Content:", htmlContent);
    // const result = await mammoth.convertToHtml({
    //   buffer: docxContent,
    // });
    // const htmlContent = result;

    // Load HTML content using Cheerio
    const $ = cheerio.load(htmlContent);
    const questions = [];
    const tableElements = $("table:not(table table)");
    const totalQuestionCount = tableElements.length;
    // check for the number of questions
    if (
      event.numberOfQuestions &&
      tableElements.length < event.numberOfQuestions
    ) {
      connectionId = await sendSocketMessage(connectionId, event.processingId, {
        message: `Doesn't have required number of questions`,
        isError: true,
        finished: true,
      });
      console.log("Doesn't have required number of questions");
      return;
    }
    // Loop through table
    for (let index = 0; index < tableElements.length; index++) {
      // console.log("table element:", index + 1);
      const questionObject = {
        processingId: event.processingId,
        external: true,
        instituteId: event.instituteId,
        branchId: event.branchId,
        createdBy: event.createdBy,
        courseId: event.courseId,
        topicId: event.topicId,
        sharable: event.sharable,
      };
      const s3Urls = [];
      let hasError = false;
      if (event.subTopicId) questionObject["subTopicId"] = event.subTopicId;
      if (event.author) questionObject["author"] = event.author;
      const rowElements = $(tableElements[index]).find("tr:not(tr tr)");
      const getQuestion = async (rowElements) => {
        const rowElement = rowElements[2];
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
          // throw "No coloumn found";
          // connectionId = await sendSocketMessage(
          //   connectionId,
          //   event.processingId,
          //   {
          //     message: `No coloumn found - table format is wrong - table number ${
          //       index + 1
          //     }`,
          //     isError: true,
          //   }
          // );
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
        // if (rowIndex === 0) {
        //   // do validation to check if it's a valid id
        //   const subject = $(rowElement)
        //     .find(`${tableColumn}:first-child`)
        //
        //     .text();
        //   questionObject.subject = subject;
        // }
        // if (rowIndex === 1) {
        //   // do validation to check if it's a valid id
        //   const chapter = $(rowElement)
        //     .find(`${tableColumn}:first-child`)
        //
        //     .text();
        //   questionObject.chapter = chapter;
        // }
        // if (rowIndex === 2) {
        //   // do validation to check if it's a valid id
        //   const topic = $(rowElement)
        //     .find(`${tableColumn}:first-child`)
        //
        //     .text();
        //   questionObject.topic = topic;
        // }
        if (rowIndex === 0) {
          let difficultyValue = $(rowElement)
            .find(`${tableColumn}:first-child`)

            .text();
          difficultyValue = difficultyValue.trim().toLowerCase();
          const difficulty = difficultyLevels.findIndex(
            (diff) => diff === difficultyValue
          );
          if (difficulty === -1) {
            // throw `Unknown difficulty level: ${difficultyValue}`;
            // connectionId = await sendSocketMessage(
            //   connectionId,
            //   event.processingId,
            //   {
            //     message: `Unknown difficulty level: ${difficultyValue}`,
            //     isError: true,
            //     question: question,
            //   }
            // );
            errors.push({
              message: `Unknown difficulty level: ${difficultyValue}`,
              questionNumber: index + 1,
              question: question,
            });
            console.log(`Unknown difficulty level: ${difficultyValue}`);
            await deleteImagesFromS3(s3Urls);
            hasError = true;
            break;
          }
          questionObject.difficulty = difficulty + 1;
        }
        if (rowIndex === 1) {
          const type = $(rowElement)
            .find(`${tableColumn}:first-child`)

            .text()
            .trim()
            .toLocaleLowerCase();
          if (!questionTypes.includes(type)) {
            // throw `Unknown question type: ${type}`;
            // connectionId = await sendSocketMessage(
            //   connectionId,
            //   event.processingId,
            //   {
            //     message: `Unknown question type: ${type}`,
            //     isError: true,
            //     question: question,
            //   }
            // );
            errors.push({
              message: `Unknown question type: ${type}`,
              questionNumber: index + 1,
              question: question,
            });
            console.log(`Unknown question type : ${type}`);
            await deleteImagesFromS3(s3Urls);
            hasError = true;
            break;
          }
          questionObject.type = type;
        }
        if (rowIndex === 2) {
          // const imageElements = $(rowElement)
          //   .find(`${tableColumn}:first-child`)
          //
          //   .find("img");
          // for (let imgIndex = 0; imgIndex < imageElements.length; imgIndex++) {
          //   const imgElement = imageElements[imgIndex];
          //   let src = "default-src";
          //   src = $(imgElement).attr("src");
          //   src = await uploadPNGToS3(src);
          //   // src = "no-src";
          //   s3Urls.push(new URL(src).pathname.substring(1));
          //   $(imgElement).attr("src", src);
          // }

          let question = $(rowElement)
            .find(`${tableColumn}:first-child`)
            .html();
          if (questionObject.type === "matrix") {
            question = he.decode(question);
          }
          questionObject.question = { text: question };
        }

        if (rowIndex > 2 && rowIndex < tableRowsLenght - 2) {
          questionObject.options = questionObject.options ?? [];
          if (questionObject.type === "matrix") {
            // same as others, no need of extra logic
            // const firstColumn = questionObject.options["firstColumn"];
            // const secondColumn = questionObject.options["secondColumn"];
            // // the options are in 2nd and 4th columns
            // for (let column of [2, 4]) {
            //   const imageElements = $(rowElement)
            //     .find(`${tableColumn}:nth-child(${column})`)
            //
            //     .find("img");
            //   for (
            //     let imgIndex = 0;
            //     imgIndex < imageElements.length;
            //     imgIndex++
            //   ) {
            //     const imgElement = imageElements[imgIndex];
            //     let src = $(imgElement)
            //       .attr("src")
            //       ;
            // src = await uploadPNGToS3(src);
            // src = "no-src";
            //     $(imgElement).attr("src", src);
            //   }
            //   const option = $(rowElement)
            //     .find(`${tableColumn}:nth-child(${column})`)
            //     .html();
            //   if (column === 2)
            //     questionObject.options["firstColumn"] =
            //       firstColumn !== undefined
            //         ? {
            //             ...firstColumn,
            //             ...{ [`option${rowIndex - 5}`]: option },
            //           }
            //         : { [`option${rowIndex - 5}`]: option };
            //   else
            //     questionObject.options["secondColumn"] =
            //       secondColumn !== undefined
            //         ? {
            //             ...secondColumn,
            //             ...{ [`option${rowIndex - 5}`]: option },
            //           }
            //         : { [`option${rowIndex - 5}`]: option };
            // }
          } else {
            const imageElements = $(rowElement)
              .find(`${tableColumn}:nth-child(2)`)

              .find("img");
            for (
              let imgIndex = 0;
              imgIndex < imageElements.length;
              imgIndex++
            ) {
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
            questionObject.options.push({
              d: { text: option },
              v: rowIndex - 3,
            });
          }
        }
        if (rowIndex === tableRowsLenght - 2) {
          let correctOption = $(rowElement)
            .find(`${tableColumn}:first-child`)

            .text()
            .trim();
          if (["mcq", "assertion"].includes(questionObject.type)) {
            correctOption = parseInt(correctOption);
            if (isNaN(correctOption)) {
              // throw `Answer option not a number for type: ${questionObject.type}`;
              // connectionId = await sendSocketMessage(
              //   connectionId,
              //   event.processingId,
              //   {
              //     message: `Answer option not a number for type: ${questionObject.type}`,
              //     isError: true,
              //     question: question,
              //   }
              // );
              errors.push({
                message: `Answer should be the option number for type ${questionObject.type}`,
                questionNumber: index + 1,
                question: question,
              });
              console.log(
                `Answer should be the option number for type ${questionObject.type}`
              );
              await deleteImagesFromS3(s3Urls);
              hasError = true;
              break;
            }

            questionObject.answer = correctOption - 1;
          } else if (
            ["multiple_mcq", "multiple_mcq_any", "number-range"].includes(
              questionObject.type
            )
          ) {
            let wrongAnswerFormat = false;
            let options = correctOption.split(",").map((option, optIndex) => {
              if (optIndex > 1 && questionObject.type === "number-range") {
                validationError.push(
                  `Answer option in wrong format for type: ${questionObject.type}, provide two numbers separated by a comma`
                );
              }
              let numberOption = parseInt(option.trim());
              if (isNaN(numberOption)) {
                // throw "Answer option not a number in multiple_mcq";
                wrongAnswerFormat = true;
              }
              return questionObject.type === "number-range"
                ? numberOption
                : numberOption - 1;
            });
            if (wrongAnswerFormat) {
              validationError.push(
                `Wrong answer format for type ${questionObject.type}`
              );
            }
            if (validationError.length !== 0) {
              // connectionId = await sendSocketMessage(
              //   connectionId,
              //   event.processingId,
              //   {
              //     message: validationError[0],
              //     isError: true,
              //     question: question,
              //   }
              // );
              for (const validationErr of validationError) {
                errors.push({
                  message: validationErr,
                  questionNumber: index + 1,
                  question: question,
                });
                console.log(validationErr);
              }
              validationError = [];
              await deleteImagesFromS3(s3Urls);
              hasError = true;
              break;
            }
            questionObject.answer = options;
          } else if (questionObject.type === "number") {
            let option = parseFloat(correctOption);
            if (isNaN(option)) {
              // throw "Answer option not a number in number type";
              // connectionId = await sendSocketMessage(
              //   connectionId,
              //   event.processingId,
              //   {
              //     message: "Answer option not a number in number type",
              //     isError: true,
              //     question: question,
              //   }
              // );
              errors.push({
                message: "Answer must be a number for type number",
                questionNumber: index + 1,
                question: question,
              });
              console.log("Answer must be a number for type number");
              await deleteImagesFromS3(s3Urls);
              hasError = true;
              break;
            }
            // const numbersArray = correctOption.match(/\d+/g);

            // if (numbersArray) {
            //   // Convert the array of strings to an array of numbers
            //   const numbersOnly = numbersArray.map(Number);
            questionObject.answer = option;
            // } else {
            //   throw "No number found in answer, for number type question";
            // }
          } else if (questionObject.type === "tf") {
            const trueValue = correctOption.trim().toLowerCase() === "true";
            const falseValue = correctOption.trim().toLowerCase() === "false";
            if (!trueValue && !falseValue) {
              // connectionId = await sendSocketMessage(
              //   connectionId,
              //   event.processingId,
              //   {
              //     message: "Answer option should be true or false in tf type",
              //     isError: true,
              //     question: question,
              //   }
              // );
              errors.push({
                message: "Answer should be true or false for type tf",
                questionNumber: index + 1,
                question: question,
              });
              console.log("Answer should be true or false for type tf");
              await deleteImagesFromS3(s3Urls);
              hasError = true;
              break;
            }
            questionObject.answer =
              correctOption.trim().toLowerCase() === "true";
          } else if (questionObject.type === "matrix") {
            let wrongAnswerFormat = false;
            let optionNotANumber = false;
            const optionArray = [];
            correctOption.split(",").forEach((el, elIndex) => {
              const spEl = el.split(":"); // [a,ab]
              if (spEl.length !== 2) {
                wrongAnswerFormat = true;
              }
              let position = parseInt(spEl[0].trim());
              if (isNaN(position)) {
                // throw "Answer option not a number in matrix";
                optionNotANumber = true;
                // connectionId =  await sendSocketMessage(connectionId, event.processingId, {
                //   message: "Answer option not a number in matrix",
                //   isError: true,
                // });
              }

              const chars = spEl[1].trim();
              const charArray = [];
              for (let char of chars) {
                char = parseInt(char);
                if (isNaN(char)) {
                  // throw "Answer option not a number in matrix";
                  optionNotANumber = true;
                  // connectionId =  await sendSocketMessage(connectionId, event.processingId, {
                  //   message: "Answer option not a number in matrix",
                  //   isError: true,
                  // });
                }
                charArray.push(char - 1);
              }
              optionArray[position - 1] = charArray;
            });
            if (wrongAnswerFormat) {
              validationError.push(
                "Wrong answer option format for type matrix"
              );
            }
            if (optionNotANumber) {
              validationError.push(
                "Answer option is not a number for type matrix"
              );
            }
            if (validationError.length !== 0) {
              // connectionId = await sendSocketMessage(
              //   connectionId,
              //   event.processingId,
              //   {
              //     message: validationError[0],
              //     isError: true,
              //     question: question,
              //   }
              // );
              for (const validationErr of validationError) {
                errors.push({
                  message: validationErr,
                  questionNumber: index + 1,
                  question: question,
                });
                console.log(validationErr);
              }
              validationError = [];
              await deleteImagesFromS3(s3Urls);
              hasError = true;
              break;
            }

            questionObject.answer = optionArray;
          } else if (
            ["fill-blank", "descriptive"].includes(questionObject.type)
          ) {
            questionObject.answer = correctOption;
          } else {
            // throw `wrong answer format for type:${questionObject.type}`;
            // connectionId = await sendSocketMessage(
            //   connectionId,
            //   event.processingId,
            //   {
            //     message: `wrong answer format for type:${questionObject.type}`,
            //     isError: true,
            //     question: question,
            //   }
            // );
            errors.push({
              message: `wrong answer format for type ${questionObject.type}`,
              questionNumber: index + 1,
              question: question,
            });
            console.log(`wrong answer format for type ${questionObject.type}`);
            await deleteImagesFromS3(s3Urls);
            hasError = true;
            break;
          }
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
          questionObject.solution = { text: answer };
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

    // await sendFileThroughSocket(connectionId, event.processingId);
    // return;

    if (questions.length !== 0) {
      const DocQuestion = getModelWithCollection(collectionName);
      await DocQuestion.insertMany(questions);
      console.log("data added to the db", event.processingId, event);
      await updateDocUploadStatus({
        processingId: event.processingId,
        filename: event.filename,
      });
      console.log("updated upload status in the data in dynamo");
      // await sendSocketMessage(connectionId, event.processingId, {
      //   message: "Uploaded file data to db",
      //   finished: true,
      // });
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
      console.log("conImgData", convertedImageData);


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

/* const sendFileThroughSocket = async (connectionId, processingId) => {
  console.log("in sendFileThroughSocket");
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
      const workbook = xlsx.utils.book_new();

      // Add a worksheet with sample data
      const worksheet = xlsx.utils.json_to_sheet([
        { Name: "John", Age: 30, City: "New York" },
        { Name: "Jane", Age: 25, City: "San Francisco" },
        { Name: "Bob", Age: 35, City: "Seattle" },
      ]);

      // Add the worksheet to the workbook
      xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");

      // Write the workbook to a buffer
      const excelBuffer = xlsx.write(workbook, {
        bookType: "xlsx",
        type: "base64",
      });

      for (let i = 0; i < excelBuffer.length; i += chunkSize) {
        const isLastChunk = i + chunkSize >= excelBuffer.length;
        const chunk = excelBuffer.slice(i, i + chunkSize);
        ws.send(JSON.stringify({ data: chunk, isLastChunk }));
      }

      // Send the Excel file to the connection
      await apiGateway
        .postToConnection({
          ConnectionId: connectionId,
          Data: excelBuffer,
        })
        .promise();
      console.log("sent file");
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
 */