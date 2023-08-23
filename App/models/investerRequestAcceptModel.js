
let mongoose =require('mongoose')

const investerRequestAcceptModelSchema = new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'investor',
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'investor',
    },
 },
{ 
  timestamps: true
}
)
const userModels = mongoose.model("investerUpRequestAccept", investerRequestAcceptModelSchema)
module.exports=userModels;