const Joi = require("joi");

module.exports.createTest = Joi.object({
  user_id: Joi.string().required(),
  test_id: Joi.string().required(),

  institute_test_name: Joi.string(),
  test_pattern: Joi.string(),
  course_id: Joi.string(),
  test_start_time: Joi.date(),
  test_end_time: Joi.date(),
  test_duration: Joi.number(),
  test_duration_type: Joi.string(),
  total_test_questions: Joi.number(),
  total_marks: Joi.number(),
  addPassword: Joi.boolean(),
  password: Joi.string(),
  instruction_text: Joi.string(),
  institute_details: Joi.object({
    institute_id: Joi.string(),
    institute_name: Joi.string(),
  }),
  branch_details: Joi.array().items({
    branch_id: Joi.string(),
    branch_name: Joi.string(),
  }),
  batch_details: Joi.array().items({
    batch_id: Joi.string(),
    batch_name: Joi.string(),
  }),
  created_by: Joi.object({
    id: Joi.string().length(24),
    name: Joi.string(),
    role: Joi.string(),
  }),
  test_details: Joi.object({
    subjects_details: Joi.array().items({
      subject_id: Joi.string(),
      subject_name: Joi.string(),
      total_questions_for_subject: Joi.number(),
      is_teacher_assigned: Joi.boolean(),
      are_all_questions_added_for_subject: Joi.boolean(),
      teacher_details: Joi.object({
        institute_id: Joi.string(),
        institute_name: Joi.string(),
        branch_id: Joi.string(),
        branch_name: Joi.string(),
        teacher_id: Joi.string(),
        teacher_name: Joi.string(),
      }),
      sections: Joi.array().items({
        section_name: Joi.string(),
        question_type: Joi.string(),
        marks_per_question: Joi.number(),
        negative_mark: Joi.number(),
        optional_question: Joi.number(),
        total_questions_for_section: Joi.number(),
        questions_list: Joi.array(),
      }),
    }),
  }),
});
