let mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String },
    password: { type: String },
    token: { type: String },
    otp: { type: String },
    otp_verified: { type: Boolean, default: false },
    profilePic: { type: String },
    swipeCount: { type: Number },
    // role: {defult: 'user'}
  },
  {
    timestamps: true,
  }
);
const adminModel = mongoose.model("admin", AdminSchema);
module.exports = adminModel;
