const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

const instituteSchema = Joi.object({
  name: Joi.string(),
  logo: Joi.string(),
  isActive: Joi.boolean().default(true),
  expiryDate: Joi.date(),
  courseIds: Joi.array().items(Joi.objectId()),
  branchStudentLimit: Joi.number().integer(),
  branchTeacherLimit: Joi.number().integer(),
  branchNonTeacherLimit: Joi.number().integer(),
  studentLimit: Joi.number().integer(),
  teacherLimit: Joi.number().integer(),
  nonTeacherLimit: Joi.number().integer(),
});

module.exports = instituteSchema;
