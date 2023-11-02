const AWS = require('aws-sdk');
const s3 = new AWS.S3({ region: 'ap-south-1' });
const mongoose = require('mongoose');
const path = require('node:path');
const ObjectId = require('mongoose').Types.ObjectId;

const courseCollectionMap = [
    {
        courseIds: ["5f2515552fb05f3e77b5a0c9", "5f2127321da6307b6017d238", "5f22d358f5e6de58f69cdbba"],
        collection: "olympiad"
    },
    {
        courseIds: ["5c8a21114678cd2062dc2d34"],
        collection: "ssc"
    },
    {
        courseIds: ["5de8f167f2109b7c7646f697"],
        collection: "upsc"
    },
    {
        courseIds: ["5e12bc386ed15e08c72f429b", "5d14b391429e7911c890ca4b", "5d1f3ea6d118dc2f7fa1ea1c"],
        collection: "neet_jee"
    },
    {
        courseIds: ["5de7a251d729d0042308df72", "5e27f872e782332de9127730", "5de796dbd729d0042308df0f"],
        collection: "neet_jee_foundation"
    },
    {
        courseIds: [
            '5eb640de32fbdd39436e0804',
            '5eb6421f32fbdd39436e083e',
            '5eb643413204cc4ccbb45110',
            '5eb6444232fbdd39436e0878',
            '5eb6453f32fbdd39436e08d1',
            '5eb648ab32fbdd39436e094a',
            '5eb64ce33204cc4ccbb451bd',
            '5eb64cee3204cc4ccbb451be',
            '5edb7daa8116a8415100ffc4',
            '5edb7ebd8116a84151010001'
        ],
        collection: "icse"
    },
    {
        courseIds: ["5ba38ddb27bee8026b0307db"],
        collection: "ibps"
    },
    {
        courseIds: [
            '5e95fa77d0e69d4e536267b4',
            '5e985f364e70da2c08cb54e0',
            '5e9db235f722de4b06ac7274',
            '5ea340c579c9f40f067e144d',
            '5ea340ce0d30690e7a1ef0e2',
            '5ea475c678e7e1098c958783',
            '5ea475d0faa26608ee611626',
            '5ea475e178e7e1098c958784',
            '5ea475f0faa26608ee611627'
        ],
        collection: "cbse"
    },
];

exports.handler = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;

    const subjectId = event.subject_id;
    const courseId = event.course_id;

    await mongoose.connect('mongodb://upmyranks:upmyranks@docdb-2023-04-09-13-10-41.cgaao9qpsg6i.ap-south-1.docdb.amazonaws.com:27017/upmyranks?ssl=true&retryWrites=false', {
        useNewUrlParser: true,
        ssl: true,
        sslValidate: false,
        sslCA: path.join(__dirname, 'rds-combined-ca-bundle.pem')
    });

    const courses = await mongoose.connection.collection('courses');
    const courseData = await courses.find({ _id: new ObjectId(courseId) }).toArray();
    console.log("Cdata", courseData);

    const subjects = await mongoose.connection.collection('subjects');
    const subjectData = await subjects.find({ _id: new ObjectId(subjectId) }).toArray();
    console.log("sData", subjectData);

    if (!courseData || !subjectData) {
        return callback("Invalid course or subject id", null);
    }

    const course = courseData[0].name;
    const subject = subjectData[0].name;
    const topics = await mongoose.connection.collection('topics').find({ subjectId: new ObjectId(subjectId) }).toArray();
    const topicIds = topics.map(topic => topic._id);

    const courseItem = courseCollectionMap.find(item => item.courseIds.includes(courseId));
    if (!courseItem) {
        return callback("Invalid course id", null);
    }

    const collectionName = courseItem.collection;

    // Fetch questions for all topicIds and accumulate them in allTopicQuestions array
    const allTopicQuestions = [];

    for (const topicId of topicIds) {
        const questionsCollection = `questions_${collectionName}`;
        const query = {
            'topicId': topicId,
            'disabled': false
        };

        const questions = await mongoose.connection.collection(questionsCollection)
            .find(query)
            .toArray();

        allTopicQuestions.push(...questions);
    }

    function createChunks(arr, chunkSize) {
        const chunkedArray = [];
        for (let i = 0; i < arr.length; i += chunkSize) {
            chunkedArray.push(arr.slice(i, i + chunkSize));
        }
        return chunkedArray;
    }

    // Create chunks of allTopicQuestions
    const chunkSize = 2000; // Change this to your desired chunk size
    const chunkedQuestions = createChunks(allTopicQuestions, chunkSize);

    // Construct the prefix using course_name and subject_name
    const prefix = `${course}/${subject}`;

    // Assuming you have an AWS S3 bucket name
    const bucketName = 'demotestproducts';

    for (let i = 0; i < chunkedQuestions.length; i++) {
        const jsonFileName = `${i+1}.json`;
        const jsonFileContent = JSON.stringify(chunkedQuestions[i]);

        const params = {
            Bucket: bucketName,
            Key: `${prefix}/${jsonFileName}`,
            Body: jsonFileContent,
            ContentType: 'application/json'
        };

        try {
            await s3
                .upload(params)
                .promise();
            console.log(`chunk_${i} JSON uploaded successfully...`);
        } catch (error) {
            console.error(`Error uploading JSON chunk ${i} to S3: ${error}`);
            return callback(error, null);
        }
    }

    return callback(null, {
        status_code: 200,
        response: {
            message: 'JSON chunks uploaded to S3 successfully',
            totalChunks: chunkedQuestions.length,
        }
    });
};
