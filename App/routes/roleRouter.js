module.exports = app=>{
    let router =require('express').Router()
    var roleController  = require("../controller/roleController.js")
   
    



    router.post("/AddRole",roleController.addRole);
    router.get("/getRole",roleController.getRole);
    router.post("/createQuestions",roleController.Createquestion);
    router.get("/ListQuestions",roleController.ListQuestion);
  app.use('/',router)
}