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

exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    
    // Extract the courseId from the event object
    const courseId = event.courseId;

    if (!courseId) {
        return {
            statusCode: 400,
            body: {
                message: "Missing courseId in the event"
            }
        };
    }

    const collectionName = courseCollectionMap.find(item => item.courseIds.includes(courseId))?.collection;

    if (!collectionName) {
        return {
            statusCode: 404,
            body: {
                message: "Course not found"
            }
        };
    }

    try {
        // Establish a connection to MongoDB
        await mongoose.connect('mongodb://upmyranks:upmyranks@docdb-2023-04-09-13-10-41.cgaao9qpsg6i.ap-south-1.docdb.amazonaws.com:27017/upmyranks?ssl=true&retryWrites=false', {
            useNewUrlParser: true,
            ssl: true,
            sslValidate: false,
            sslCA: path.join(__dirname, 'rds-combined-ca-bundle.pem')
        });

        // Fetch course data for the specific courseId
        const coursesCollection = mongoose.connection.collection('courses');
        const courseData = await coursesCollection.findOne({ _id: new ObjectId(courseId) });

        // Fetch subjects for the given courseId
        const subjectsCollection = mongoose.connection.collection('subjects');
        const subjectData = await subjectsCollection.find({ 'courseId': new ObjectId(courseId) }).toArray();

        // Create an array to store the structured subjects data
        const structuredSubjects = [];

        for (const subject of subjectData) {
            // Fetch topics for the subject
            const topicsCollection = mongoose.connection.collection('topics');
            const topicData = await topicsCollection.find({ 'subjectId': subject._id }).toArray();

            // Create an array to store the structured topics data
            const structuredTopics = [];

            for (const topic of topicData) {
                // Check if the topic is a sub-topic (has a parentTopicId)
                if (topic.parentTopicId) {
                    // This is a sub-topic
                    const parentTopicIndex = structuredTopics.findIndex(parentTopic => parentTopic._id.toString() === topic.parentTopicId.toString());
                    if (parentTopicIndex !== -1) {
                        // Add the sub-topic to its parent
                        structuredTopics[parentTopicIndex].subTopics.push({
                            _id: topic._id,
                            name: topic.name,
                            parentTopicId: topic.parentTopicId,
                            __v: topic.__v
                        });
                    }
                } else {
                    // This is a main topic
                    // Fetch sub-topics for the topic
                    const subTopicsCollection = mongoose.connection.collection('subtopics');
                    const subTopicData = await subTopicsCollection.find({ 'topicId': topic._id }).toArray();

                    // Structure the topic data with sub-topics
                    const structuredTopic = {
                        _id: topic._id,
                        name: topic.name,
                        parentTopicId: topic.parentTopicId,
                        __v: topic.__v,
                        subTopics: subTopicData
                    };

                    structuredTopics.push(structuredTopic);
                }
            }

            // Structure the subject data with topics (including sub-topics)
            const structuredSubject = {
                _id: subject._id,
                name: subject.name,
                courseId: subject.courseId,
                __v: subject.__v,
                topics: structuredTopics
            };

            structuredSubjects.push(structuredSubject);
        }

        mongoose.connection.close();

        // Add subjects inside the courseData
        courseData.subjects = structuredSubjects;

        // Return the response without JSON.stringify
        return {
            statusCode: 200,
            body: {courseData}
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: {
                message: "Internal Server Error"
            }
        };
    }
};





