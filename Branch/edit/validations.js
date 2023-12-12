const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

const branchSchema = Joi.object({
  name: Joi.string(),
  logo: Joi.string(),
  address: Joi.string(),
  area: Joi.string(),
  city: Joi.string(),
  state: Joi.string(),
  pincode: Joi.number().integer(),
  contactNo: Joi.number().integer(),
  isActive: Joi.boolean().default(true),
  expiryDate: Joi.date(),
  batchStudentLimit: Joi.number().integer(),
  studentLimit: Joi.number().integer(),
  teacherLimit: Joi.number().integer(),
  nonTeacherLimit: Joi.number().integer(),
  courseIds: Joi.array().items(Joi.objectId()),
});

module.exports = branchSchema;