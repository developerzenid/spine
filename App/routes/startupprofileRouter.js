const express = require('express')
const route = express.Router()
//   console.log("my profile rouer is running")

const startupPro = require("../controller/startupprofile");

route.post("/addstartupProfile",startupPro.addstartupProfile);
route.get("/getStartupProfile",startupPro.getStartupProfile);
route.put("/editstartupProfile",startupPro.editstartupProfile);
//    console.log("my profile rouer is running2222")


module.exports = route