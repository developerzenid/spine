
let mongoose =require('mongoose')

const questionSchema = new mongoose.Schema({
    questions:{ type: Array},
 },
{ 
  timestamps: true
}
)
const userModels = mongoose.model("question", questionSchema)
module.exports=userModels;