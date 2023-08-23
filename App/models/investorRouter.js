module.exports = app=>{
    let router =require('express').Router()
    var investorControllers  = require("../controller/userInvestorController.js")
    let {checkUserAuth} = require('../middlewares/investorMiddleware.js')
    let multer =require('multer')
//image...........................................................................................
const storages = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, 'upload');
  },
  filename: function (req, file, cb) {
      cb(null, file.originalname);
  }
});
let uploadImg = multer({ storage: storages });


/*****************************************************************************************************************************/
// Images uploaded in S3 Bucket  //
//****************************************************************************************************************************/
var aws = require("aws-sdk"),
    multerS3 = require("multer-s3");
aws.config.update({
    accessKeyId: "AKIATKBRRMJNSQ3AO7XK",
    secretAccessKey: "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",
    Region: "us-east-2",
});
s3 = new aws.S3();
upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: "sportsmoneys",
        key: function (req, file, cb) {
            cb(null, "public/" + Date.now() + file.originalname); //use Date.now() for unique file keys
        },
    }),
});

//authRouter..........................................................................................
router.post("/updateProfile",checkUserAuth);
router.post("/getProfile",checkUserAuth);
// router.post("/ChangePassword",checkUserAuth);
// router.post("/setPassword",checkUserAuth);



//simple...............................................................................................
    router.post("/Signup",investorControllers.signup);
    router.post("/Login",investorControllers.Login);  
    router.post("/socialRegister",investorControllers.Socialsignup);
    router.post("/socialLogin",investorControllers.socialLogin);
    router.post("/updateSecurity",investorControllers.updateSecurity);
    router.post("/updateProfile",upload.single('file'),investorControllers.updateProfile);
    router.get("/getProfile",investorControllers.GetProfile);
    router.post("/ChangePassword",investorControllers.changePassword);


    router.post("/forgotPassword",investorControllers.forgotPassword);
    router.post("/resendOtp",investorControllers.resendOtp);

    router.post("/verifyotp",investorControllers.verifyotp);

    router.post("/verifySecurity",investorControllers.verifySecurity);
    router.post("/setPassword",investorControllers.setPassword);
    router.post("/updateProfile2",investorControllers.updateProfileSetup2);


    router.post("/MyProfile", checkUserAuth, investorControllers.MyProfile);
    router.post("/updateImage", checkUserAuth, upload.single('file'), investorControllers.updateImage);
    router.post("/changePassword", checkUserAuth,  investorControllers.changePassword);
    router.get("/fetchMyProfile", checkUserAuth,  investorControllers.fetchMyProfile);


  app.use('/investor',router)
}