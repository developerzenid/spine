
let mongoose =require('mongoose')

const startUpRequestAcceptModelSchema = new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    },
 },
{ 
  timestamps: true
}
)
const userModels = mongoose.model("startUpRequestAccept", startUpRequestAcceptModelSchema)
module.exports=userModels;