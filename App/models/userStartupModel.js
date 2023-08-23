let mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    startupName: { type: String },
    email: { type: String },
    password: { type: String },
    question: { type: String },
    answer: { type: String },
    mobile_token: { type: String },
    social_id: { type: String },
    profile_pic: { type: String },
    founderName: { type: String },
    startupName: { type: String },
    description: { type: String },
    chooseIndustry: { type: String },
    startupStage: { type: String },
    location: { type: String },
    teamSize: { type: String },
    BusinessModel: { type: String },
    fundRaise: { type: String },
    pitchDeck: { type: String },
    roundSize: { type: String },
    ticketSize: { type: String },
    pitchDeckLink: { type: String },
    session: { type: Number },
    role: {
      type: String,
      enum: ["Startup"],
    },
    otp: {
      type: String,
    },
    otp_verified: {
      type: Boolean,
      enum: [true, false],
      default: false,
    },
    intrestedIn: {
      type: [mongoose.Schema.Types.ObjectId],
      default: []
    },
  },
  {
    timestamps: true,
  }
);
const userModels = mongoose.model("user", userSchema);
module.exports = userModels;
