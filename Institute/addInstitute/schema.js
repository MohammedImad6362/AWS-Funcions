const mongoose = require("mongoose");

const instituteSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    logo: { type: String },
    isActive: { type: Boolean, default: true },
    expiryDate: { type: Date, required: true },
    courseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    branchStudentLimit: { type: Number, required: true },
    branchTeacherLimit: { type: Number, required: true },
    branchNonTeacherLimit: { type: Number, required: true },
    studentLimit: { type: Number, required: true },
    teacherLimit: { type: Number, required: true },
    nonTeacherLimit: { type: Number, required: true },
    deleted: { type: Boolean, default: false }
}, { timestamps: true });

const Institute = mongoose.model('Institute', instituteSchema);

module.exports = Institute;