// module.exports = (app) => {
let router = require("express").Router();
const adminController = require("../controller/admincontroller");
const { checkUserAuth } = require("../middlewares/middleware");

router.post("/adminSignUp", adminController.adminSignUp);
router.post("/adminLogin", adminController.adminLogin);
router.get("/adminData", checkUserAuth, adminController.getAdmin);

router.post("/adminResetPass", adminController.resetPassword);
router.post("/adminResendPass", adminController.resendOtp);
router.post("/adminVerifyOtp", adminController.verifyotp);
router.post("/adminChangePass", adminController.setPassword);

router.get("/getListUser", adminController.manageUsers);
router.get("/userInfo", adminController.singleUser);
router.delete("/deleteUser", adminController.deleteUser);

//   app.use("/", router);
// };
module.exports = router;
