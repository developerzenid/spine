module.exports = app=>{
    let router =require('express').Router()
    var investorControllers  = require("../controller/userInvestorController.js")
    let {checkUserAuth} = require('../middlewares/investorMiddleware.js')
    let multer =require('multer')
//image...........................................................................................
// const storages = multer.diskStorage({
//   destination: function (req, file, cb) {
//       cb(null, 'upload');
//   },
//   filename: function (req, file, cb) {
//       cb(null, file.originalname);
//   }
// });
// let uploadImg = multer({ storage: storages });


var aws = require("aws-sdk"),
    multerS3 = require("multer-s3");
aws.config.update({
    accessKeyId: "AKIATKBRRMJNWROSA5XS",
    secretAccessKey: "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",
    Region: "us-east-2",
});
s3 = new aws.S3();
uploadImg = multer({
    storage: multerS3({
        s3: s3,
        bucket: "spine-project",
        key: function (req, file, cb) {
            cb(null, "investor/" + Date.now() + file.originalname); //use Date.now() for unique file keys
        },
    }),
});

//authRouter..........................................................................................
// router.post("/updateProfile",checkUserAuth);
// router.post("/getProfile",checkUserAuth);
// router.post("/ChangePassword",checkUserAuth);
// // router.post("/setPassword",checkUserAuth);



//simple...............................................................................................
    router.post("/Signup",investorControllers.signup);
    router.post("/Login",investorControllers.Login);  
    router.post("/socialRegister",investorControllers.Socialsignup);
    router.post("/socialLogin",investorControllers.socialLogin);
    router.post("/updateSecurity",checkUserAuth,investorControllers.updateSecurity);
    router.post("/updateProfile",checkUserAuth,uploadImg.single('file'),investorControllers.updateProfile);
    router.get("/getProfile",checkUserAuth,investorControllers.GetProfile);
    // router.post("/ChangePassword",investorControllers.changePassword);
    router.post("/forgotPassword",investorControllers.forgotPassword);
    router.post("/resendOtp",investorControllers.resendOtp);
    router.post("/verifyotp",investorControllers.verifyotp);

    router.post("/verifySecurity",investorControllers.verifySecurity);
    router.post("/setPassword",investorControllers.setPassword);
    router.post("/updateProfile2",investorControllers.updateProfileSetup2);
    router.get("/filterInvestorData",investorControllers.filterInvestorData);
    router.post("/MyProfile", checkUserAuth, uploadImg.single('file'), investorControllers.MyProfile);
    router.post("/updateImage", checkUserAuth, uploadImg.single('file'), investorControllers.updateImage);
    router.post("/changePassword", checkUserAuth,  investorControllers.changePassword);
    router.get("/fetchMyProfile", checkUserAuth,  investorControllers.fetchMyProfile);
    router.get("/fetchInvesterUser", checkUserAuth, investorControllers.fetchInvesterUser);
    //work
    router.get("/fetchStartupUser", checkUserAuth, investorControllers.fetchStartupUser); //todo

    router.post("/sentNotification", checkUserAuth,  investorControllers.sentNotification);
    router.post("/allNotificationInvester", checkUserAuth,  investorControllers.NoficationInvester);
    //work
    router.get("/fetchNotification", checkUserAuth, investorControllers.fetchNotification);
    //work
    router.post("/acceptRequest", checkUserAuth,  investorControllers.acceptRequest);
    router.post("/rejectedRequest", checkUserAuth,  investorControllers.rejectedRequest);



  app.use('/investor',router);
}



