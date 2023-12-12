const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

const branchSchema = Joi.object({
  instituteId: Joi.objectId().required(),
  name: Joi.string().required(),
  logo: Joi.string(),
  address: Joi.string(),
  area: Joi.string(),
  city: Joi.string(),
  state: Joi.string(),
  pincode: Joi.number().integer(),
  contactNo: Joi.number().integer(),
  isActive: Joi.boolean().default(true),
  expiryDate: Joi.date().required(),
  batchStudentLimit: Joi.number().integer().required(),
  studentLimit: Joi.number().integer().required(),
  teacherLimit: Joi.number().integer().required(),
  nonTeacherLimit: Joi.number().integer().required(),
  courseIds: Joi.array().items(Joi.objectId()),
});

module.exports = branchSchema;