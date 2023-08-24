let mongoose =require('mongoose')
// Defining Schema
const startupProfileSchema = new mongoose.Schema({
 //bankDetails
  industry:[ String],
  investor_stage:[String],
  founding_tom_size: [String],
  business_model: [String],
  round_size: [String],
  ticket_size: [String],
  },
{ timestamps: true }
)

// Model
const startupProModel = mongoose.model("startup", startupProfileSchema)

module.exports=startupProModel;