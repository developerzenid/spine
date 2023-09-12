module.exports = (app) => {
  let router = require("express").Router();
  var userControllers = require("../controller/userStartupController.js");
  let { checkUserAuth } = require("../middlewares/middleware.js");
  let multer = require("multer");
  //image...........................................................................................
  const storages = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "upload");
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
  });
  let uploadImg = multer({ storage: storages });

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

  //simple...............................................................................................
  router.post("/Signup", userControllers.signup);
  router.post("/Login", userControllers.Login);
  router.post("/updateSecurity", userControllers.updateSecurity);
  router.post("/SocialRegister", userControllers.Socialsignup);
  router.post("/SocialLogin", userControllers.socialLogin);
  router.post("/ChangePassword", checkUserAuth, userControllers.changePassword);
  router.post("/forgotPaasword", userControllers.forgotPassword);
  router.post("/resendOtp", userControllers.resendOtp);
  router.post("/verifyotp", userControllers.verifyotp);
  router.post("/verifySecurity", userControllers.verifySecurity);
  router.post("/setPassword", userControllers.setPassword);
  router.post(
    "/updateProfile",
    checkUserAuth,
    upload.fields([
      {
        name: "profile_pic",
        maxCount: 1,
      },
      {
        name: "pitchDeck",
        maxCount: 1,
      },
    ]),
    userControllers.updateProfile
  );
  router.post("/setIndustry", checkUserAuth, userControllers.setIndustry);
  router.post("/setfundingteam", checkUserAuth, userControllers.setfundingTeam);
  router.post(
    "/setfundingRaise",
    checkUserAuth,
    userControllers.setfundRaising
  );
  router.get("/getProfile", checkUserAuth, userControllers.GetProfile);

  router.get("/fetchMyProfile", checkUserAuth, userControllers.fetchMyProfile);
  // router.post("/startupMyProfile", checkUserAuth,upload.single("file"), userControllers.startupMyProfile);

  router.post(
    "/startupMyProfile",
    checkUserAuth,
    upload.single("file"),
    userControllers.startupMyProfile
  );

  router.post(
    "/updateStartupImage",
    checkUserAuth,
    upload.single("file"),
    userControllers.updateStartupImage
  );

  // router.post("/updateStartupImage",checkUserAuth,  upload.single("file"),  userControllers.updateStartupImage);
  router.post(
    "/changeStartupPassword",
    checkUserAuth,
    userControllers.changeStartupPassword
  );
  //done
  router.get(
    "/fetchInvestorUser",
    checkUserAuth,
    userControllers.fetchInvestorupUser
  );
  router.get("/filterStartupData", userControllers.filterStartupData);
  // router.get("/fetchAllInvester", checkUserAuth, userControllers.fetchInvestorupUser); //todo
  router.get(
    "/fetchAllInvester",
    checkUserAuth,
    userControllers.fetchAllInvesterUser
  );

  router.post(
    "/sentNotification",
    checkUserAuth,
    userControllers.sentNotification
  );
  //not use
  router.post(
    "/allNotificationStartUp",
    checkUserAuth,
    userControllers.NoficationStatupStartUp
  );
  //user
  router.get(
    "/fetchNotification",
    checkUserAuth,
    userControllers.fetchNotification
  );
  router.post("/acceptRequest", checkUserAuth, userControllers.acceptRequest);
  router.post(
    "/rejectedRequest",
    checkUserAuth,
    userControllers.rejectedRequest
  );

  //get single user info by params

  router.get("/getCardUser", userControllers.getCardData);

  router.get("/listAcceptUser", checkUserAuth, userControllers.acceptUser);

  //get chat for a particular user

  router.get("/getChat", checkUserAuth, userControllers.fetchChat);

  router.get("/fetchChatUser", checkUserAuth, userControllers.listChatUsers);

  router.put(
    "/mobileNotify",
    checkUserAuth,
    userControllers.updataMobileNotify
  );

  router.patch("/swipeCountPush", checkUserAuth, userControllers.countSet);

  app.use("/", router);
};
