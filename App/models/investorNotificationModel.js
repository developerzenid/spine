let mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    },
    to_send: {
        type: mongoose.Schema.Types.ObjectId,  //To send
        ref: 'investor',
    },
    status: {
        type: String,
        enum: ['accept', 'reject' ,'pending'],
        defult: 'pending',
    },

    title:{
        type:String
    }
},
    {
        timestamps: true
    })
const Notification = mongoose.model("investorNotification", notificationSchema)
module.exports = Notification;