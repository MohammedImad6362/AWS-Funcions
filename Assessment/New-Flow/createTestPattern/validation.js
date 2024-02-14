const Joi = require("joi");

module.exports.superAdminTemplateValidation = Joi.object({
  test_name: Joi.string().required(),
  course_details: Joi.object({
    course_id: Joi.string().required(),
    course_name: Joi.string().required(),
  }).required(),
  subjects_details: Joi.array()
    .items({
      subject_id: Joi.string().required(),
      subject_name: Joi.string().required(),
      total_questions_for_subject: Joi.number().required(),
      sections: Joi.array()
        .items({
          section_name: Joi.string().required(),
          question_type: Joi.string().required(),
          marks_per_question: Joi.number().required(),
          negative_mark: Joi.number().required(),
          optional_question: Joi.number().required(),
          questions_list: Joi.array(),
          questions_from: Joi.number().required(),
          questions_to: Joi.number().required(),
        })
        .required(),
    })
    .required(),
  total_questions: Joi.number().required(),
  total_marks: Joi.number().required(),
  test_duration: Joi.number().required(),
  instruction_text: Joi.string().required(),
}).required();
