
let mongoose = require('mongoose')

const investorSchema = new mongoose.Schema({

  investorName: { type: String },
  email: { type: String },
  password: { type: String },
  question: { type: String },
  answer: { type: String },
  name: { type: String },
  mobile_token: { type: String },
  social_id: { type: String },
  profile_pic: { type: String },
  bio: { type: String },
  typeOfInvestor: { type: String },
  chooseIndustry: { type: String },
  investorStage: { type: String },
  location: { type: String },
  roundSize: { type: String },
  ticketSize: { type: String },
  session:{type:Number},
  role: {
    type: String,
    enum: ['Investor']
  },
  intrestedIn:{
    type:[mongoose.Schema.Types.ObjectId],
    default: []
  },
  otp: {
    type: String,
  },
  otp_verified: {
    type: Boolean,
    enum: [true, false],
    default: false,
  },
  

},
  {
    timestamps: true
  }
)
const investorModels = mongoose.model("investor", investorSchema)
module.exports = investorModels;