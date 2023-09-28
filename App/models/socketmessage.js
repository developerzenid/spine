const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chatSchema = new Schema(
  {
    user_id: { type: String },
    to_send: { type: String },
    message: { type: String },
    time: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("chat", chatSchema);
