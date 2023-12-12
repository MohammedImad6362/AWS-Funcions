const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

const batchSchema = Joi.object({
  branchId: Joi.objectId().required(),
  name: Joi.string().required(),
  courseIds: Joi.array().items(Joi.objectId()),
  startDate: Joi.date(),
  endDate: Joi.date(),
  startTime: Joi.string(),
  endTime: Joi.string(),
  isActive: Joi.boolean().default(true),
  studentLimit: Joi.number().integer().required(),
  teachers: Joi.array().items(Joi.objectId()), 
  published: Joi.array().items(Joi.string()),
});

module.exports = batchSchema;