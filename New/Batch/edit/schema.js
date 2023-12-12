const mongoose = require("mongoose");

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


const batchSchema = new mongoose.Schema({
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    required: true,
  },
  name: { type: String },
  courseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
  startDate: { type: Date },
  startTime: { type: String },
  endDate: { type: Date },
  endTime: { type: String },
  isActive: { type: Boolean, default: true },
  studentLimit: { type: Number },
  teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 
  published: [{ type: String }],
}, {timestamps: true});

const Batch = mongoose.model("Batch", batchSchema);


module.exports = {Branch, Batch};