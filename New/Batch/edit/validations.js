const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

const batchSchema = Joi.object({
  name: Joi.string(),
  courseIds: Joi.array().items(Joi.objectId()),
  startDate: Joi.date(),
  endDate: Joi.date(),
  startTime: Joi.string(),
  endTime: Joi.string(),
  isActive: Joi.boolean().default(true),
  studentLimit: Joi.number().integer(),
  teachers: Joi.array().items(Joi.objectId()), 
  published: Joi.array().items(Joi.string()),
});

module.exports = batchSchema;