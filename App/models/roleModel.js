
let mongoose =require('mongoose')

const userSchema = new mongoose.Schema({
 role:{ type: String},
},
{ 
  timestamps: true
})
const userModels = mongoose.model("role", userSchema)
module.exports=userModels;