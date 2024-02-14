const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema(
  {
    option: { type: String, required: true },
    number: { type: Number, required: true },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema({
  qrCodeId: { type: String, required: true },
  questionNo: { type: Number, required: true },
  question: {
    type: String,
    required: true,
  },
  options: [optionSchema],
  answer: { type: Number },
  solution: { type: String },
  deleted: { type: Boolean, default: false },
  mainInstruction: { type: String },
  mainDescription: { type: String },
  processingId: String,
});

const QRQuestion = mongoose.model("QRQuestion", questionSchema, "questions_QR");

module.exports = QRQuestion;
