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
    deleted: { type: Boolean, default: false }
}, { timestamps: true });

const Institute = mongoose.model('Institute', instituteSchema);


const branchSchema = new mongoose.Schema({
    instituteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Institute",
        required: true,
    },
    name: { type: String, unique: true },
    logo: { type: String },
    address: { type: String },
    area: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    contactNo: { type: String },
    isActive: { type: Boolean, default: true },
    expiryDate: { type: Date },
    batchStudentLimit: { type: Number },
    studentLimit: { type: Number },
    teacherLimit: { type: Number },
    nonTeacherLimit: { type: Number },
    courseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
}, { timestamps: true });

const Branch = mongoose.model("Branch", branchSchema);

module.exports = {Institute, Branch};