module.exports = app=>{
const { addMessage, getMessages ,deleteMessage,getConnectedUsers} = require("../controller/startUpMessageController");
const router = require("express").Router();

var aws = require("aws-sdk"),
multerS3 = require("multer-s3");
const multer = require("multer")
aws.config.update({
      accessKeyId: "AKIATKBRRMJNWROSA5XS",
      secretAccessKey: "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",
      Region: "us-east-2",
});
    s3 = new aws.S3();
    upload = multer({
     storage: multerS3({
      s3: s3,
      bucket: "spine-project",
      key: function (req, file, cb) {
        cb(null, "startUpMessageImg/" + Date.now() + file.originalname); //use Date.now() for unique file keys
     },
   }),
});

router.post("/startup/addmsg",upload.single('file'), addMessage);
router.get("/startup/getmsg", getMessages);
router.get("/startup/getConnectedUsers", getConnectedUsers);
router.delete("/startup/delmsg", deleteMessage);

app.use('/',router);
}

