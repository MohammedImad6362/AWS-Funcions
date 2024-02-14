const Joi = require("joi");

module.exports.createTest = Joi.object({
  institute_test_name: Joi.string().required(),
  institute_id: Joi.string().required(),
  test_pattern: Joi.string().required(),
  course_id: Joi.string().required(),
  institute_details: Joi.object({
    institute_id: Joi.string().required(),
    institute_name: Joi.string().required(),
  }).required(),
  branch_details: Joi.object({
    branch_id: Joi.string().required(),
    branch_name: Joi.string().required(),
  }).required(),
  batch_details: Joi.object({
    batch_id: Joi.string().required(),
    batch_name: Joi.string().required(),
  }).required(),
  test_details: Joi.object({
    subjects_details: Joi.array()
      .items({
        subject_id: Joi.string().required(),
        subject_name: Joi.string().required(),
        total_questions_for_subject: Joi.number().required(),
        is_teacher_assigned: Joi.boolean().required(),
        are_all_questions_added_for_subject: Joi.boolean(),
        teacher_details: Joi.object({
          institute_id: Joi.string(),
          institute_name: Joi.string(),
          branch_id: Joi.string(),
          branch_name: Joi.string(),
          teacher_id: Joi.string(),
          teacher_name: Joi.string(),
        }).required(),
        sections: Joi.array()
          .items({
            section_name: Joi.string().required(),
            question_type: Joi.string().required(),
            marks_per_question: Joi.number().required(),
            negative_mark: Joi.number().required(),
            optional_question: Joi.number().required(),
            total_questions_for_section: Joi.number().required(),
            questions_list: Joi.array().required(),
          })
          .required(),
      })
      .required(),
  }).required(),
  test_start_time: Joi.date().required(),
  test_end_time: Joi.date().required(),
  test_duration: Joi.number().required(),
  test_duration_type: Joi.string().required(),
  total_test_questions: Joi.number().required(),
  total_marks: Joi.number().required(),
  instruction_text: Joi.string().required(),
  addPassword: Joi.boolean().required(),
  password: Joi.string().optional().allow(""),
});
