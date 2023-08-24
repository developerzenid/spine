let mongoose =require('mongoose')
// Defining Schema
const investorProfileSchema = new mongoose.Schema({
 //bankDetails
  industry:[ String],
  investor_stage:[String],
  round_size: [String],
  ticket_size: [String],
  type_of_investor: [String],
  },
{ timestamps: true }
)

// Model
const InvestorProModel = mongoose.model("investora", investorProfileSchema)

module.exports=InvestorProModel;