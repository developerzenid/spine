let mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId, //whome send
        ref: 'investor',
    },
    to_send: {
        type: mongoose.Schema.Types.ObjectId,  //To send
        ref: 'user',
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
const Notification = mongoose.model("notification", notificationSchema)
module.exports = Notification;