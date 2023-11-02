const aws = require("aws-sdk");
const XLSX = require("xlsx");
const s3 = new aws.S3({ region: "ap-south-1" });
const cognito = new aws.CognitoIdentityServiceProvider();
const db = new aws.DynamoDB.DocumentClient({ resgion: "ap-south-1" });
exports.handler = async (event, context, callback) => {
  await GetXl(event).then(async (x) => {
    var workbook = XLSX.read(x.Body, { type: "buffer" });
    var pages = workbook.SheetNames;

    var data = XLSX.utils.sheet_to_json(workbook.Sheets[pages[0]]);
    var final_array = [];
    console.log("initialData", data);

    for (let i = 0; i < data.length; i++) {
      var datetime = new Date();
      console.log(datetime.toISOString());
      console.log(`${data[0].roll_no}${datetime.toISOString()}`);
      if (data[i].user_role.toLowerCase() == "student")
        data[i].user_id = data[i].roll_no.toString() + datetime.toISOString();
      console.log("dob", data[i]);
      try {
        await cognito
          .signUp({
            ClientId: "7k6a8mfavvsj2srjkqm828j5di",
            Password: data[i].password || data[i].admission_no,
            Username: data[i].userName,
            UserAttributes: [
              {
                Name: "name",
                Value: data[i].firstname + data[i].lastname,
              },
              {
                Name: "email",
                Value: "mailtest@gmail.com",
              },
              {
                Name: "birthdate",
                Value: "10-08-1998",
              },
              {
                Name: "phone_number",
                Value: `+91${data[i].mobile}`,
              },
              {
                Name: "custom:custom:role",
                Value: data[i].user_role,
              },
            ],
          })
          .promise();
      } catch (error) {
        console.log("error", error);
        return callback(null, {
          status_code: 500,
          response: { error, message: "Error on adding users to cognito" },
        });
      }
      if (data[i].user_role.toLowerCase() == "student") {
        // data.forEach((data[i]) => {
        if (final_array.length != 0) {
          var find_index = final_array.findIndex(
            (rollno) => rollno.roll_no == data[i].roll_no
          );
          if (find_index != -1) {
            var objc = {
              course_id: data[i].course_id,
            };
            final_array[find_index].course.push(objc);
          } else {
            var obj = {
              user_id: data[i].user_id,
              roll_no: data[i].roll_no,
              admission_no: data[i].admission_no,
              userName: data[i].userName,
              father_name: data[i].father_name,
              mobile: `+91${data[i].mobile}`,
              class: data[i].class,
              firstname: data[i].firstname,
              lastname: data[i].lastname,
              dob: data[i].dob,
              user_role: data[i].user_role,
              institute_id: data[i].institute_id,
              branch_id: data[i].branch_id,
              batch_id: data[i].batch_id,
              batch_name: data[i].batch_name,
              status: data[i].status,
              gender: data[i].gender,
              course: data[i].course_id_1
                ? [
                    {
                      course_id: data[i].course_id,
                      course_name: data[i].course_name,
                    },
                    {
                      course_id: data[i].course_id_1,
                      course_name: data[i].course_name_1,
                    },
                  ]
                : [
                    {
                      course_id: data[i].course_id,
                      course_name: data[i].course_name,
                    },
                  ],
            };
            final_array.push(obj);
          }
        } else {
          var obj = {
            user_id: data[i].user_id,
            roll_no: data[i].roll_no,
            admission_no: data[i].admission_no,
            userName: data[i].userName,
            father_name: data[i].father_name,
            mobile: `+91${data[i].mobile}`,
            class: data[i].class,
            firstname: data[i].firstname,
            lastname: data[i].lastname,
            dob: data[i].dob,
            user_role: data[i].user_role,
            institute_id: data[i].institute_id,
            branch_id: data[i].branch_id,
            batch_id: data[i].batch_id,
            batch_name: data[i].batch_name,
            status: data[i].status,
            gender: data[i].gender,
            course: data[i].course_id_1
              ? [
                  {
                    course_id: data[i].course_id,
                    course_name: data[i].course_name,
                  },
                  {
                    course_id: data[i].course_id_1,
                    course_name: data[i].course_name_1,
                  },
                ]
              : [
                  {
                    course_id: data[i].course_id,
                    course_name: data[i].course_name,
                  },
                ],
          };
          final_array.push(obj);
        }
        // });
      } else if (
        data[i].user_role.toLowerCase() == "staff" ||
        data[i].user_role.toLowerCase() == "teacher"
      ) {
        // data.forEach((data[i]) => {
        var obj = {
          user_id: data[i].user_id,
          firstname: data[i].firstname,
          lastname: data[i].lastname,
          dob: data[i].dob,
          mobile: "+91" + data[i].mobile,
          department: data[i].department,
          designation: data[i].designation,
          gender: data[i].gender,
          blood_group: data[i].blood_group,
          spouse_name: data[i].spouse_name,
          fathername: data[i].fathername,
          date_of_joining: data[i].date_of_joining,
          profile_pictute: data[i].profile_pictute,
          email: data[i].email,
          pincode: data[i].pincode,
          address: data[i].address,
          state: data[i].state,
          city: data[i].city,
          area_name: data[i].area_name,
          emergency_connumber: data[i].emergency_connumber,
          emergnecy_contact_person: data[i].emergnecy_contact_person,
          educational_background: data[i].educational_background,
          completion_year: data[i].completion_year,
          expericence: data[i].expericence,
          collage_cityname: data[i].collage_cityname,
          collage_name: data[i].collage_name,
          previous_institutename: data[i].previous_institutename,
          bank_account_no: data[i].bank_account_no,
          bank_branch: data[i].bank_branch,
          bank_ifsc: data[i].bank_ifsc,
          bank_name: data[i].bank_name,
          PAN_number: data[i].PAN_number,
          PF_account_number: data[i].PF_account_number,
          EPS_account_number: data[i].EPS_account_number,
          passport_expiry: data[i].passport_expiry,
          passport_no: data[i].passport_no,
          contract_start_date: data[i].contract_start_date,
          country_of_issue: data[i].country_of_issue,
          contract_type: data[i].contract_type,
          user_role: data[i].user_role,
          institute_id: data[i].institute_id,
          branch_id: data[i].branch_id,
        };
        final_array.push(obj);
        // });
      }
    }
    console.log("finalArray", final_array);
    let dsdsd = [];
    let ccc = [];

    // for (let i = 0; i < DB.length; i++) {
    //     data.forEach((dd) => {
    //         if (dd.roll_no === DB[i].roll_no) {
    //             console.log(DB[i].course_id, "jojisfh");
    //             ccc.push({
    //                 c: dd.course_id,
    //             });
    //         }
    //     });
    //     dsdsd.push({
    //         userId: DB[i].roll_no,
    //         course: ccc,
    //     });
    // }

    if (final_array.length <= 25) {
      try {
        await BatchWrite(final_array);
        return callback(null, {
          status_code: 200,
          response: { message: "Added Users", fileName: event.file_name },
        });
      } catch (error) {
        return callback(null, {
          status_code: 500,
          response: { error, message: "Error on adding to db" },
        });
      }
    } else {
      var arr = [];

      for (let i = 0; i < final_array.length; i += 25) {
        const subArray = final_array.slice(i, i + 25);
        arr.push(subArray);
      }

      for (let i = 0; i < arr.length; i++) {
        await BatchWrite(arr[i])
          .then((r) => {
            if (i + 1 == arr.length) {
              return callback(null, {
                status_code: 200,
                response: { message: "Added Users", fileName: event.file_name },
              });
            }
          })
          .catch((error) => {
            return callback(null, {
              status_code: 500,
              response: { error, message: "Error on adding to db" },
            });
          });
      }
    }
  });
};

async function BatchWrite(data) {
  console.log("data to db", data);
  var f_data = [];
  data.forEach((l, i) => {
    f_data.push({
      PutRequest: {
        Item: l,
      },
    });
  });
  let params = {
    RequestItems: {
      ["Users"]: f_data,
    },
  };

  return db.batchWrite(params).promise();
}

function GetXl(event) {
  const params = {
    Bucket: "allassestsupmyranks",
    Key: `xlxs/${event.file_name}`,
  };
  console.log(params.Key)

  return s3.getObject(params).promise();
}
