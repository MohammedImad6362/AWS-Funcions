const Joi = require("joi");

module.exports.createBranch = Joi.object({
  name: Joi.string().required(),
  logo: Joi.string().required(),
  contact_no: Joi.string()
    .pattern(/^\d{10}$/)
    .required(), // Assuming 10-digit phone number
  email: Joi.string().email().required(),
  address: Joi.string().required(),
  pincode: Joi.string()
    .pattern(/^\d{6}$/)
    .required(), // Assuming 6-digit pincode
  area: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  course_ids: Joi.array().items(Joi.string().required()),
  expiry_date: Joi.date().iso().required(),
  student_limit: Joi.number().integer().required(),
  teacher_limit: Joi.number().integer().required(),
  nonteacher_limit: Joi.number().integer().required(),
  question_limit: Joi.number().integer().required(),
  institute_id: Joi.string().required(),
  password: Joi.string(),
  status: Joi.string()
});
