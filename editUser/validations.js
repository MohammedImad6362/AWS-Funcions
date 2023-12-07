const Joi = require("joi");

const studentSchema = Joi.object({
  firstname: Joi.string().allow(''),
  lastname: Joi.string().allow(''),
  mobile: Joi.string().pattern(/^[0-9]{10}$/).allow(''),
  userName: Joi.string().regex(/^[\p{L}\p{M}\p{S}\p{N}\p{P}]+$/u).allow(''),
  password: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/).allow(''),
  dob: Joi.date().iso().allow(''),
  batch_id: Joi.string().allow(''),
  batch_name: Joi.string().allow(''),
  year: Joi.string().allow(''),
  academic_year: Joi.string().allow(''),
  gender: Joi.string().valid('Male', 'Female').allow(''),
  address: Joi.string().allow(''),
  pincode: Joi.string().allow(''),
  state: Joi.string().allow(''),
  city: Joi.string().allow(''),
  nationality: Joi.string().allow(''),
  area_name: Joi.string().allow(''),
  aadhar_no: Joi.string().allow(''),
  religion: Joi.string().allow(''),
  community: Joi.string().allow(''),
  caste: Joi.string().allow(''),
  father_name: Joi.string().allow(''),
  mother_name: Joi.string().allow(''),
  parent_mobile: Joi.string().pattern(/^[0-9]{10}$/).allow(''),
  registration_type: Joi.string().allow(''),
  sats_no: Joi.string().allow(''),
  status: Joi.string().valid('ACTIVE', 'INACTIVE').allow(''),
  course: Joi.array().items(
    Joi.object({
      course_id: Joi.string().allow(''),
      course_name: Joi.string().allow(''),
    })
  ).allow(''),
  created_by: Joi.string().email().allow(''),
  remarks: Joi.string().allow(''),
  user_role: Joi.string().valid('STUDENT').allow(''),
  institute_id: Joi.string().allow(''),
  branch_id: Joi.string().allow(''),
  admission_no: Joi.string().allow('')
});

const teacherSchema = Joi.object({
  firstname: Joi.string().allow(''),
  lastname: Joi.string().allow(''),
  dob: Joi.date().iso().allow(''),
  mobile: Joi.string().pattern(/^[0-9]{10}$/).allow(''),
  userName: Joi.string().regex(/^[\p{L}\p{M}\p{S}\p{N}\p{P}]+$/u).allow(''),
  password: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/).allow(''),
  department: Joi.string().allow(''),
  designation: Joi.string().allow(''),
  gender: Joi.string().valid('male', 'female', 'other').allow(''),
  blood_group: Joi.string().allow(''),
  spouse_name: Joi.string().allow(''),
  fathername: Joi.string().allow(''),
  date_of_joining: Joi.date().iso().allow(''),
  profile_pictute: Joi.string().allow(''),
  email: Joi.string().email().allow(''),
  pincode: Joi.string().allow(''),
  address: Joi.string().allow(''),
  state: Joi.string().allow(''),
  city: Joi.string().allow(''),
  area_name: Joi.string().allow(''),
  emergency_connumber: Joi.string().pattern(/^[0-9]{10}$/).allow(''),
  emergnecy_contact_person: Joi.string().pattern(/^[0-9]{10}$/).allow(''),
  educational_background: Joi.string().allow(''),
  completion_year: Joi.date().iso().allow(''),
  expericence: Joi.number().integer().allow(''),
  collage_cityname: Joi.string().allow(''),
  collage_name: Joi.string().allow(''),
  previous_institutename: Joi.string().allow(''),
  bank_account_no: Joi.string().allow(''),
  bank_branch: Joi.string().allow(''),
  bank_ifsc: Joi.string().allow(''),
  bank_name: Joi.string().allow(''),
  PAN_number: Joi.string().allow(''),
  PF_account_number: Joi.string().allow(''),
  EPS_account_number: Joi.string().allow(''),
  passport_expiry: Joi.date().iso().allow(''),
  passport_no: Joi.string().allow(''),
  contract_start_date: Joi.date().iso().allow(''),
  country_of_issue: Joi.string().allow(''),
  contract_type: Joi.string().valid('fulltime', 'parttime').allow(''),
  user_role: Joi.string().valid('TEACHER', 'STAFF').allow(''),
  institute_id: Joi.string().allow(''),
  branch_id: Joi.string().allow(''),
  status: Joi.string().valid('ACTIVE', 'INACTIVE').allow(''),
});


module.exports = { studentSchema, teacherSchema };

