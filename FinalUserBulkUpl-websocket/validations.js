const Joi = require("joi");

const studentSchema = Joi.object({
  ['firstname*']: Joi.string().required(),
  lastname: Joi.string().allow(''),
  ['mobile*']: Joi.string().pattern(/^[0-9]{10}$/).required(),
  ['userName*']: Joi.string().regex(/^[\p{L}\p{M}\p{S}\p{N}\p{P}]+$/u).required(),
  ['password*']: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/).required(),
  dob: Joi.date().allow(''),
  ['batch_id*']: Joi.string().required(),
  ['batch_name*']: Joi.string().required(),
  year: Joi.string().allow(''),
  academic_year: Joi.string().allow(''),
  gender: Joi.string().valid('male', 'female', 'MALE', 'FEMALE').allow(''),
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
  ['status*']: Joi.string().valid('ACTIVE', 'INACTIVE').required(),
  ['course_id*']: Joi.string().required(),
  ['course_name*']: Joi.string().required(),
  course_id_1: Joi.string().allow(''),
  course_name_1: Joi.string().allow(''),
  remarks: Joi.string().allow(''),
  ['user_role*']: Joi.string().valid('STUDENT').required(),
  ['admission_no*']: Joi.string().required()
});

const teacherSchema = Joi.object({
  ['firstname*']: Joi.string().required(),
  lastname: Joi.string().allow(''),
  dob: Joi.date().allow(''),
  ['mobile*']: Joi.string().pattern(/^[0-9]{10}$/).required(),
  ['userName*']: Joi.string().regex(/^[\p{L}\p{M}\p{S}\p{N}\p{P}]+$/u).required(),
  ['password*']: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/).required(),
  ['department*']: Joi.string().required(),
  ['designation*']: Joi.string().required(),
  gender: Joi.string().valid('male', 'female', 'MALE', 'FEMALE').allow(''),
  blood_group: Joi.string().allow(''),
  spouse_name: Joi.string().allow(''),
  father_name: Joi.string().allow(''),
  date_of_joining: Joi.date().allow(''),
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
  completion_year: Joi.date().allow(''),
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
  passport_expiry: Joi.date().allow(''),
  passport_no: Joi.string().allow(''),
  contract_start_date: Joi.date().allow(''),
  country_of_issue: Joi.string().allow(''),
  contract_type: Joi.string().valid('fulltime', 'parttime').allow(''),
  ['user_role*']: Joi.string().valid('TEACHER', 'STAFF').required(),
  ['status*']: Joi.string().valid('ACTIVE', 'INACTIVE').required(),
});


module.exports = { studentSchema, teacherSchema };
