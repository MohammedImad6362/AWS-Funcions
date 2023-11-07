const AWS = require('aws-sdk');
const XLSX = require('xlsx');

const s3 = new AWS.S3({ region: 'ap-south-1' });
const cognito = new AWS.CognitoIdentityServiceProvider();
const db = new AWS.DynamoDB.DocumentClient({ region: 'ap-south-1' });

exports.handler = async (event, context, callback) => {
    try {
        // Retrieve Excel data from S3
        const excelData = await GetXL(event.file_name);
        const workbook = XLSX.read(excelData.Body, { type: 'buffer' });
        const pages = workbook.SheetNames;
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[pages[0]]);
        const finalArray = [];

        for (let i = 0; i < data.length; i++) {
            const datetime = new Date();
            const user = data[i];

            // Create user ID for students
            if (user.user_role.toLowerCase() === 'student') {
                user.user_id = user.roll_no.toString() + datetime.toISOString();
            }

            try {
                // Create users in Cognito
                await cognito.signUp({
                    ClientId: '7k6a8mfavvsj2srjkqm828j5di',
                    Password: user.password || user.admission_no.toString(),
                    Username: user.userName,
                    UserAttributes: [
                        {
                            Name: 'name',
                            Value: user.firstname + ' ' + user.lastname,
                        },
                        {
                            Name: 'email',
                            Value: 'mailtest@gmail.com',
                        },
                        {
                            Name: 'birthdate',
                            Value: '10-08-1998',
                        },
                        {
                            Name: 'phone_number',
                            Value: `+91${user.mobile}`,
                        },
                        {
                            Name: 'custom:custom:role',
                            Value: user.user_role,
                        },
                    ],
                }).promise();
            } catch (error) {
                console.log('Cognito error', error);
                return {
                    status_code: 500,
                    response: { error, message: 'Error on adding users to Cognito' },
                };
            }

            if (user.user_role.toLowerCase() === 'student') {
                const userObj = {
                    user_id: user.user_id,
                    roll_no: user.roll_no,
                    admission_no: user.admission_no,
                    userName: user.userName,
                    father_name: user.father_name,
                    mobile: user.mobile,
                    class: user.class,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    dob: user.dob,
                    user_role: user.user_role,
                    institute_id: user.institute_id,
                    branch_id: user.branch_id,
                    batch_id: user.batch_id,
                    batch_name: user.batch_name,
                    status: user.status,
                    gender: user.gender,
                    course: user.course_id_1
                        ? [
                              {
                                  course_id: user.course_id,
                                  course_name: user.course_name,
                              },
                              {
                                  course_id: user.course_id_1,
                                  course_name: user.course_name_1,
                              },
                          ]
                        : [
                              {
                                  course_id: user.course_id,
                                  course_name: user.course_name,
                              },
                          ],
                };
                finalArray.push(userObj);
            } else if (user.user_role.toLowerCase() === 'staff' || user.user_role.toLowerCase() === 'teacher') {
                const userObj = {
                    user_id: user.user_id,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    dob: user.dob,
                    mobile: user.mobile,
                    department: user.department,
                    designation: user.designation,
                    gender: user.gender,
                    blood_group: user.blood_group,
                    spouse_name: user.spouse_name,
                    fathername: user.fathername,
                    date_of_joining: user.date_of_joining,
                    profile_picture: user.profile_picture,
                    email: user.email,
                    pincode: user.pincode,
                    address: user.address,
                    state: user.state,
                    city: user.city,
                    area_name: user.area_name,
                    emergency_connumber: user.emergency_connumber,
                    emergency_contact_person: user.emergency_contact_person,
                    educational_background: user.educational_background,
                    completion_year: user.completion_year,
                    experience: user.experience,
                    college_cityname: user.college_cityname,
                    college_name: user.college_name,
                    previous_institute_name: user.previous_institute_name,
                    bank_account_no: user.bank_account_no,
                    bank_branch: user.bank_branch,
                    bank_ifsc: user.bank_ifsc,
                    bank_name: user.bank_name,
                    PAN_number: user.PAN_number,
                    PF_account_number: user.PF_account_number,
                    EPS_account_number: user.EPS_account_number,
                    passport_expiry: user.passport_expiry,
                    passport_no: user.passport_no,
                    contract_start_date: user.contract_start_date,
                    country_of_issue: user.country_of_issue,
                    contract_type: user.contract_type,
                    user_role: user.user_role,
                    institute_id: user.institute_id,
                    branch_id: user.branch_id,
                };
                finalArray.push(userObj);
            }

            // Batch write users to DynamoDB when the finalArray reaches the desired batch size
            if (finalArray.length >= 100) {
                await BatchWrite(finalArray);
                finalArray.length = 0;
            }
        }

        // Write any remaining users in the finalArray
        if (finalArray.length > 0) {
            await BatchWrite(finalArray);
        }

        return {
            status_code: 200,
            response: { message: 'Added Users', fileName: event.file_name },
        };
    } catch (error) {
        console.log('Error', error);
        return {
            status_code: 500,
            response: { error, message: 'Error on processing the Excel file' },
        };
    }
};

async function BatchWrite(data) {
    const batchedItems = [];

    // Split the data into batches of 25 items for DynamoDB
    for (let i = 0; i < data.length; i += 25) {
        batchedItems.push(data.slice(i, i + 25));
    }

    // Perform batch writes for each batch of items
    for (const batch of batchedItems) {
        const params = {
            RequestItems: {
                'Users': batch.map((user) => ({
                    PutRequest: {
                        Item: user,
                    },
                })),
            },
        };

        try {
            await db.batchWrite(params).promise();
        } catch (error) {
            console.error('Error:', error);
            // Handle any errors that occurred during the batch write
        }
    }
}

async function GetXL(file_name) {
    const params = {
        Bucket: 'allassestsupmyranks',
        Key: `xlxs/${file_name}`,
    };

    const response = await s3.getObject(params).promise();
    console.log('Excel file retrieved successfully.');

    return response;
}
