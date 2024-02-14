const mongoose = require("mongoose");

const instituteTestSchema = new mongoose.Schema(
  {
    institute_test_name: {
      type: String,
      required: true,
    },
    test_pattern: {
      type: String,
      required: true,
    },
    course_id: {
      type: String,
      required: true,
    },
    institute_details: {
      institute_id: {
        type: String,
        default: "",
      },
      institute_name: {
        type: String,
        default: "",
      },
    },
    branch_details: {
      branch_id: {
        type: String,
        default: "",
      },
      branch_name: {
        type: String,
        default: "",
      },
    },
    batch_details: {
      batch_id: {
        type: String,
        default: "",
      },
      batch_name: {
        type: String,
        default: "",
      },
    },
    test_details: {
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
          is_teacher_assigned: {
            type: Boolean,
            default: false,
          },
          are_all_questions_added_for_subject: {
            type: Boolean,
            default: false,
          },
          teacher_details: {
            institute_id: {
              type: String,
              default: "",
            },
            institute_name: {
              type: String,
              default: "",
            },
            branch_id: {
              type: String,
              default: "",
            },
            branch_name: {
              type: String,
              default: "",
            },
            teacher_id: {
              type: String,
            },
            teacher_name: {
              type: String,
            },
          },
          sections: [
            {
              _id: false,
              section_name: {
                type: String,
              },
              question_type: {
                type: String,
                enum: ["MCQ", "FITB", "QA", "TF"],
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
              questions_list: [
                {
                  type: mongoose.Types.ObjectId,
                },
              ],
              total_questions_for_section: {
                type: Number,
              },
            },
          ],
        },
      ],
    },
    test_start_time: {
      type: Date,
      required: true,
    },
    test_end_time: {
      type: Date,
      required: true,
    },
    test_duration: {
      type: Number,
      required: true,
    },
    test_duration_type: {
      type: String,
      default: false,
      enum: ["FIXED", "NONE", "PRACTICE"],
    },
    total_test_questions: {
      type: Number,
    },
    total_marks: {
      type: Number,
    },
    instruction_text: {
      type: String,
    },
    addPassword: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const InstituteTest = mongoose.model("InstituteTest", instituteTestSchema);
module.exports.InstituteTest = InstituteTest;
