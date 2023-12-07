const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

const instituteSchema = Joi.object({
  name: Joi.string().required(),
  logo: Joi.string(),
  isActive: Joi.boolean().default(true),
  expiryDate: Joi.date().required(),
  courseIds: Joi.array().items(Joi.objectId()),
  branchStudentLimit: Joi.number().integer().required(),
  branchTeacherLimit: Joi.number().integer().required(),
  branchNonTeacherLimit: Joi.number().integer().required(),
  studentLimit: Joi.number().integer().required(),
  teacherLimit: Joi.number().integer().required(),
  nonTeacherLimit: Joi.number().integer().required(),
});

module.exports = instituteSchema;
