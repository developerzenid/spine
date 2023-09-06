// module.exports = (app) => {
let router = require("express").Router();
const adminController = require("../controller/admincontroller");
const { checkUserAuth } = require("../middlewares/middleware");

const multer = require("multer");
var aws = require("aws-sdk"),
  multerS3 = require("multer-s3");
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
      cb(null, "startUp/" + Date.now() + file.originalname); //use Date.now() for unique file keys
    },
  }),
});

router.post("/adminSignUp", adminController.adminSignUp);
router.post("/adminLogin", adminController.adminLogin);
router.get("/adminData", checkUserAuth, adminController.getAdmin);
router.post(
  "/updateadminprofile",
  checkUserAuth,
  upload.single("file"),
  adminController.updateAdminProfile
);

router.post("/adminResetPass", adminController.resetPassword);
router.post("/adminResendPass", adminController.resendOtp);
router.post("/adminVerifyOtp", adminController.verifyotp);
router.post("/adminChangePass", adminController.changeAdminPassword);

router.get("/getListUser", adminController.manageUsers);
router.get("/userInfo", adminController.singleUser);
router.delete("/deleteUser", adminController.deleteUser);

//   app.use("/", router);
// };
module.exports = router;
