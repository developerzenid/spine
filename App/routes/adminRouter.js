module.exports = (app) => {
  let router = require("express").Router();
  var adminController = require("../controller/admincontroller");

  router.post("/adminSignUp", adminController.adminSignUp);
  router.post("/adminLogin", adminController.adminLogin);
  router.post("/adminResetPass", adminController.resetPassword);
  router.post("/adminResendPass", adminController.resendOtp);
  router.post("/adminVerifyOtp", adminController.verifyotp);
  router.post("/adminChangePass", adminController.setPassword);

  app.use("/", router);
};
