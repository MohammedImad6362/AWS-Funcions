const mongoose = require("mongoose");

const instituteSchema = new mongoose.Schema({
    name: { type: String },
    logo: { type: String },
    isActive: { type: Boolean, default: true },
    expiryDate: { type: Date },
    courseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    branchStudentLimit: { type: Number },
    branchTeacherLimit: { type: Number },
    branchNonTeacherLimit: { type: Number },
    studentLimit: { type: Number },
    teacherLimit: { type: Number },
    nonTeacherLimit: { type: Number },
}, { timestamps: true });

const Institute = mongoose.model('Institute', instituteSchema);

module.exports = Institute;