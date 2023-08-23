
const modelRole  = require('../models/roleModel.js')
const questionModel  = require('../models/startupQuestionModel.js')

//addRole.............................................................................................
module.exports.addRole = async(req, res) => {
    console.log(".....................",req.body);
    const{role} =req.body;
       try {
            const data = new modelRole({
                role: role,
              })
            await data.save()
          res.status(200).send({"success":true, "status": "200", "message": "Add Role Successfully"})
          }catch (error) {
            console.log(error)
            res.status(401).send({ "success":false, "Status": "401", "message": "Unable to Add" })
    }
}
//GetRole.............................................................................................
module.exports.getRole = async (req, res) => {
    try{
        const data = await modelRole.findOne();
       if (data) {
            res.status(200).send({"success":true, "status": "200", "message": "Get role Succesfully",data})
          } else {
            res.status(401).send({ "status": "failed", "message": "Something Went Wrong" })
          }
        }catch(err){
          res.status(401).send({ "status": "failed", "message": "Something Went Wrong" })
          console.log("error",err);
        }
    }
//AddQuestionList
module.exports.Createquestion = async(req, res) => {
    const { questions } =req.body;
   console.log(".....................",req.body);
   try{
             const data = new questionModel({
               questions: questions,
             })
             await data.save()
             res.status(200).send({"success":true, "status": "200", "message": "Create Question List  Successfully"})
           }catch (error) {
             console.log(error)
             res.status(401).send({ "success":false, "Status": "401", "message": "Unable to Create" })
           }
       }
//List Question.......................................................................................................//
 module.exports.ListQuestion = async (req, res) => {
    try{
        const data = await questionModel.findOne();
      if (data) {
          res.status(200).send({"success":true, "status": "200", "message": "GetList  question  video Succesfully",data})
        } else {
          res.status(401).send({ "status": "failed", "message": "Something Went Wrong" })
        }
      }catch(err){
        res.status(401).send({ "status": "failed", "message": "Something Went Wrong" })
        console.log("error",err);
      }
        }
   