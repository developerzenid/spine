const express = require('express')
const route = express.Router()
const {checkUserAuth} = require("../middlewares/middleware");

//   console.log("my profile rouer is running")

const investorPro = require("../controller/investorprofile");

route.post("/addInvestorProfile",investorPro.addInvestorProfile);
route.get("/getInvestorProfile",investorPro.getInvestorProfile);
route.put("/editInvestorProfile", investorPro.editInvestorProfile);
//    console.log("my profile rouer is running2222")


module.exports = route