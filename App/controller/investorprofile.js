let InvestorProModel=require('../models/investorprofileModel')

exports.addInvestorProfile=async(req,res)=>{
    console.log(">>>>>>>>> in addInvestorProfile >>>>>>>.. ")
    try{
    let data=req.body;
    console.log("my data is===========",data)
    let addProfile=await new InvestorProModel(data).save()
    if(!addProfile){
        return res.status(401).json({
            status: false,
            message: "unable to add investor profile"
        })
    }else{
        return res.status(200).json(
            {
                status:true,
                message:"successfully added investor profile",
                response:addProfile
            }
        )
    }
}catch(err){
    return res.status(401).json({
        "success": false,
        "Status": "401",
        "message": err.message,
      })
}
}

exports.getInvestorProfile=async(req,res)=>{
       try{
        let data=req.body;
        let investorprofile=await InvestorProModel.find()
        if(!investorprofile){
            return res.status(401).json({
                status: false,
                message: "unable to get investors profile"
            })
        }else{
            return res.status(200).json({
                status: true,
                message: "successfully accessed investors profile",
                response:investorprofile
            })
        }
           
       }catch(err){
        return res.status(401).json({
            "success": false,
            "Status": "401",
            "message": err.message,
          })
       }
}

exports.editInvestorProfile=async(req,res)=>{
    try{
         let data=req.body;
         console.log("my data is----------",data)
         let checkProfile=await InvestorProModel.findOne({_id:data._id})
         if(!checkProfile){
            return res.status(401).json({
                "success": false,
                "Status": "401",
                "message": "unable to get the user",
              })
         }else{
            let criteria={_id:data._id}
           let options={new:true}
           let editprofile=await InvestorProModel.findOneAndUpdate(criteria,data,options)
           if(!editprofile){
              return res.status(401).json(
                {
                    "success": false,
                    "Status": "401",
                    "message": "unable to update  the investor profile",
                }
              )
           }else{
            return res.status(200).json({
                status: true,
                message: "successfully updated investors profile",
                response:editprofile
           }

            )

         }
        }
    }catch(err){
        return res.status(401).json({
            "success": false,
            "Status": "401",
            "message": err.message,
          })
    }
}