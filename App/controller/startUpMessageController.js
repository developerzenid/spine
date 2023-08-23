const startUpMessageModel = require("../models/startUpMessageModel");
const startUpRequestAccept=require("../models/startUpRequestAcceptModel")



module.exports.getMessages = async (req, res, next) => {
  try {
    const { from, to } = req.body;
    const messages = await startUpMessageModel.find({
      users: {
        $all: [from, to],
      },
      sender:from,
    }).sort({ updatedAt: 1 });
    console.log("Message",messages); 
    const projectedMessages = messages.map((msg) => {
      console.log(" fromSelf: msg.sender.toString() === from,", msg.sender.toString() === from)
      //if this return false that's means message from other side if return true that's means
      //message from my side
      console.log("id",msg._id)
      return {
        fromSelf: msg.sender.toString() === from,
        message: msg.message.text,
        messageId:msg._id
      };
    });
    res.json(projectedMessages);
  } catch (ex) {
    next(ex);
  }
};

// module.exports.addMessage = async (req, res, next) => {
//   try {
//     const { from, to, message } = req.body;
//     const data = await startUpMessageModel.create({
//       message: { text: message },
//       users: [from, to],
//       sender: from,
//     });

//     if (data) return res.json({ msg: "Message added successfully." });
//     else return res.json({ msg: "Failed to add message to the database" });
//   } catch (ex) {
//     next(ex);
//   }
// };

module.exports.deleteMessage = async (req, res, next) => {
  try {
    const messageId = req.body.messageId; // Assuming the message ID is provided as a URL parameter

    // Delete the message with the specified ID
    const result = await startUpMessageModel.deleteOne({ _id: messageId });

    if (result.deletedCount > 0) {
      return res.json({ msg: 'Message deleted successfully.' });
    } else {
      return res.json({ msg: 'Message not found.' });
    }
  } catch (ex) {
    next(ex);
  }
};

module.exports.getConnectedUsers = async (req, res, next) => {
  try {
    const {userId} = req.query; // The user ID you want to find connections for
    const connectedUsers = await startUpRequestAccept.aggregate([
      { $match: { $or: [{ from: userId }, { to: userId }] } },
      {
        $group: {
          _id: null,
          connectedUsers: { $addToSet: { $cond: [{ $eq: ['$from', userId] }, '$to', '$from'] } }
        }
      },
      { $project: { _id: 0, connectedUsers: 1 } }
    ]);

    const result = connectedUsers.length > 0 ? connectedUsers[0].connectedUsers : [];
    const userDetails = await userModel.find({ _id: { $in: result } });
    return res.json(userDetails);
  //  return res.json(result);
  } catch (ex) {
    next(ex);
  }
};

module.exports.addMessage = async (req, res, next) => {
  try {
    const { from, to, message } = req.body;
    const data = await startUpMessageModel.create({
      message: { text: message,   fileUrl: req.file ? req.file.location : '', },
      users: [from, to],
      sender: from,
    });

    if (data) return res.json({ msg: "Message added successfully." });
    else return res.json({ msg: "Failed to add message to the database" });
  } catch (ex) {
    next(ex);
  }
};