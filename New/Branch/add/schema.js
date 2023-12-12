const mongoose = require("mongoose");

const instituteSchema = new mongoose.Schema({
    name: { type: String, required: true },
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


const branchSchema = new mongoose.Schema({
    instituteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Institute",
        required: true,
    },
    name: { type: String, required: true, unique: true },
    logo: { type: String },
    address: { type: String },
    area: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    contactNo: { type: String },
    isActive: { type: Boolean, default: true },
    expiryDate: { type: Date },
    batchStudentLimit: { type: Number, required: true },
    studentLimit: { type: Number, required: true },
    teacherLimit: { type: Number, required: true },
    nonTeacherLimit: { type: Number, required: true },
    courseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    deleted: { type: Boolean, default: false }
}, { timestamps: true });

const Branch = mongoose.model("Branch", branchSchema);

module.exports = {Institute, Branch};