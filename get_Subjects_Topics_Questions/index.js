var mongoose = require('mongoose');
const path = require('node:path');
var ObjectId = require('mongoose').Types.ObjectId;

const courseCollectionMap = [{
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
    const type = event.type;
    const id = event.id; //"5d1f4070d118dc2f7fa1ea1e";
    const page = event.page;
    const limit = event.limit;
    const questionTypes = event.questionTypes;
    const subTopic = event.subTopic;
    await mongoose.connect('mongodb://upmyranks:upmyranks@docdb-2023-04-09-13-10-41.cgaao9qpsg6i.ap-south-1.docdb.amazonaws.com:27017/upmyranks?ssl=true&retryWrites=false', {
            useNewUrlParser: true,
            ssl: true,
            sslValidate: false,
            sslCA: path.join(__dirname, 'rds-combined-ca-bundle.pem')
        }, )
        .then(async (db) => {

            if (type.toLowerCase() == "courses") {
                const courses = await mongoose.connection.collection('courses');
                const data = await courses.find({}).toArray();

                return callback(null, {
                    status_code: 200,
                    response: {
                        page: page,
                        limit: limit,
                        totalPage: Math.ceil(data.length / limit),
                        data: data
                    }

                });

            }
            if (type.toLowerCase() == "subjects") {
                const subjects = await mongoose.connection.collection('subjects');

                const data = await subjects.find({ 'courseId': new ObjectId(id) }).toArray();
                console.log(data)
                return callback(null, {
                    status_code: 200,
                    response: {
                        page: page,
                        limit: limit,
                        totalPage: Math.ceil(data.length / limit),
                        data: data
                    }

                });
            }
            if (type.toLowerCase() == "topics") {

                var paged_data = [];
                const topics = await mongoose.connection.collection('topics');
                const datacount = await topics.find({ 'subjectId': new ObjectId(id) }).toArray();
                // const data = await topics.find({ 'subjectId': new ObjectId(id) }).sort().skip(page * limit).limit(limit).forEach(topics => paged_data.push(topics)).then(() => {
                //     console.log(topics)

                // }).catch((e) => {
                //     console.log(e);
                // });
                const mainTopics = await topics.aggregate([{
                        $match: { 'subjectId': new ObjectId(id) }
                    },
                    {
                        $lookup: {
                            from: 'topics',
                            localField: '_id',
                            foreignField: 'parentTopicId',
                            as: 'subTopics'
                        }
                    },
                    {
                        $skip: page * limit
                    },
                    {
                        $limit: limit
                    }
                ]).toArray();
                console.log(JSON.stringify(`mainTopics: ${mainTopics}`))
                mainTopics.forEach(topic => {
                    if (!topic.parentTopicId) { // Check if the topic is not a subtopic
                        const mainTopicData = {
                            _id: topic._id,
                            name: topic.name,
                            subjectId: topic.subjectId,
                            courseId: topic.courseId,
                            subTopics: topic.subTopics
                        };
                        paged_data.push(mainTopicData);
                    }
                });

                return callback(null, {
                    status_code: 200,
                    response: {
                        pages: page,
                        limit: limit,
                        totalPage: Math.ceil(datacount.length / limit),
                        data: paged_data
                    }

                });


            }
            if (type.toLowerCase() == "questions") {

                var paged_data = [];
                const courseId = event.course_id;
                //const query = (!!subTopic && subTopic.length !== ) ? { 'subTopicId': { $in: subTopic.map(id => new ObjectId(id)) }, disabled: false } : { 'topicId': new ObjectId(id), disabled: false };
               const query = (!!subTopic && subTopic.length !== 0) ? { 'subTopicId': { $in: subTopic.map(id => new ObjectId(id)) }, disabled: false } : { 'topicId': { $in: id.map(singleId => new ObjectId(singleId)) }, disabled: false };

                if (Array.isArray(questionTypes) && (questionTypes.length !== 0)) query.type = { $in: questionTypes };
                // const queryT = { 'subTopicId': new ObjectId(subTopic), disabled: false };
                // if (Array.isArray(questionTypes) && (questionTypes.length !== 0)) queryT.type = { $in: questionTypes };

                const collectionName = courseCollectionMap.find(item => item.courseIds.includes(courseId))?.collection;
                console.log("colleionnam",collectionName, query)
                const questions = await mongoose.connection.collection(`questions_${collectionName}`);
                const datacount = await questions.find(query).toArray();
                // questions.find(queryT).sort().skip(page * limit).limit(limit).forEach((question) => {
                //     paged_data.push(question);
                // });
                const data = await questions.find(query).sort().skip(page * limit).limit(limit).forEach((question) => {
                    paged_data.push(question)

                }).then(async () => {

                    for (const question of paged_data) {
                        const regex = /<img\b[^>]*>/i;
                        const questioncontainsImgTag = regex.test(question.question.text);
                        const solutioncontainsImgTag = regex.test(question.solution.text);
                        // const optioncontainsImgTag = question.options.some(obj => regex.test(obj.d.text));
                        if (question.options !== undefined) {
                            for (const option of question.options) {
                                const optionContainsImgTag = regex.test(option.d.text);
                                if (optionContainsImgTag == true) {
                                    let srcRegex = /src=['"](.*?)['"]/gi;
                                    let srcValues = option.d.text.match(srcRegex).map(src => src.slice(5, -1));
                                    const linkRegex = /^https?:\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/i;
                                    if (srcValues.some(item => linkRegex.test(item))) {
                                        // console.log(srcValues);
                                    }
                                    else {
                                        var data = await getAssetsFromImgTag(srcValues, collectionName);
                                        //console.log(data);  
                                        data.forEach((Y) => {
                                            option.d.text = option.d.text.replace(Y._id.toHexString(), Y.url)
                                        });

                                    }
                                }
                            }
                        }
                        const assets = question.assets;
                        if (questioncontainsImgTag == true) {
                            let srcRegex = /src=['"](.*?)['"]/gi;
                            let srcValues = question.question.text.match(srcRegex).map(src => src.slice(5, -1));
                            const linkRegex = /^https?:\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/i;
                            if (srcValues.some(item => linkRegex.test(item))) {
                                // console.log(srcValues);
                            }
                            else {
                                var data = await getAssetsFromImgTag(srcValues, collectionName);
                                //console.log(data);  
                                data.forEach((Y) => {
                                    question.question.text = question.question.text.replace(Y._id.toHexString(), Y.url)
                                });

                            }
                        }
                        if (solutioncontainsImgTag == true) {
                            let srcRegex = /src=['"](.*?)['"]/gi;
                            let srcValues = question.solution.text.match(srcRegex).map(src => src.slice(5, -1));
                            const linkRegex = /^https?:\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/i;
                            if (srcValues.some(item => linkRegex.test(item))) {
                                // console.log(srcValues);
                            }
                            else {
                                var data = await getAssetsFromImgTag(srcValues, collectionName);
                                //console.log(data);  
                                data.forEach((Y) => {
                                    question.solution.text = question.solution.text.replace(Y._id.toHexString(), Y.url)
                                });

                            }

                        }



                        if (assets.length != 0) {
                            var data = await getAssets(assets, collectionName);
                            question.assets_link = data;
                        }
                    }

                    //  console.log(paged_data)

                    //        console.log(paged_data);
                }).catch((e) => {
                    console.log(e);
                });

                return callback(null, {
                    status_code: 200,
                    response: {
                        page: page,
                        limit: limit,
                        totalPage: Math.ceil(datacount.length / limit),
                        data: paged_data
                    }

                });
            }
            if (type.toLowerCase() == "questiontypes") {
                const courseId = event.course_id;
                const topicId = event.topic_id;
                const collectionName = courseCollectionMap.find((item) =>
                    item.courseIds.includes(courseId)
                )?.collection;

                const Question = mongoose.connection.collection(
                    `questions_${collectionName}`
                );

                try {
                    const result = await Question.aggregate([{
                            $match: {
                                topicId: new ObjectId(topicId),
                                disabled: false
                            },
                        },
                        {
                            $group: {
                                _id: "$type", // Group by questionType
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                type: "$_id",
                            },
                        },
                    ]).toArray();

                    let questionTypes = result;

                    if (result.length !== 0) {
                        questionTypes = result.map(rslt => rslt.type)
                    }

                    return callback(null, {
                        status_code: 200,
                        response: {
                            types: questionTypes,
                        },
                    });
                }
                catch (error) {
                    console.error(error);
                }








            }









        }).catch((err) => console.error(err, 'Error'));

    // 




};


async function getAssets(assets, collectionName) {
    var arr = [];
    const Assets = await mongoose.connection.collection(`assets_${collectionName}`);

    const promises = assets.map(async (X) => {


        var test = await Assets.findOne({ _id: X });
        // console.log(test);
        // console.log(test);

        arr.push(test);
    })

    await Promise.all(promises);
    return arr;
}

async function getAssetsFromImgTag(assets, collectionName) {
    var arr = [];
    const Assets = await mongoose.connection.collection(`assets_${collectionName}`);
    //  console.log(assets);
    const promises = assets.map(async (X) => {


        var test = await Assets.findOne({ _id: new ObjectId(X) });
        // console.log(test);
        // console.log(test);

        arr.push(test);
    })

    await Promise.all(promises);
    return arr;
}
