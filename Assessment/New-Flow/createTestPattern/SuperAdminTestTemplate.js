const mongoose = require("mongoose");

const superAdminTestTemplateSchema = new mongoose.Schema(
  {
    test_name: {
      type: String,
      required: true,
    },
    course_details: {
      course_id: String,
      course_name: String,
    },

    subjects_details: [
      {
        _id: false,
        subject_id: {
          type: String,
        },
        subject_name: {
          type: String,
        },
        total_questions_for_subject: {
          type: Number,
        },
        sections: [
          {
            _id: false,
            section_name: {
              type: String,
            },
            question_type: {
              type: String,
              enum: ["MCQ", "FITB", "QA"],
              default: "MCQ",
            },
            marks_per_question: {
              type: Number,
            },
            negative_mark: {
              type: Number,
            },
            optional_question: {
              type: Number,
            },
            questions_list: {
              type: Array,
              default: [],
            },
            questions_from: {
              type: Number,
            },
            questions_to: {
              type: Number,
            },
          },
        ],
      },
    ],
    total_questions: {
      type: Number,
    },
    total_marks: {
      type: Number,
    },
    test_duration: {
      type: Number,
    },
    instruction_text: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const SuperAdminTestTemplate = mongoose.model(
  "SuperAdminTestTemplate",
  superAdminTestTemplateSchema
);
module.exports.SuperAdminTestTemplate = SuperAdminTestTemplate;
