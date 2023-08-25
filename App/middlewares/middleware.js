let modelUser = require("../models/userStartupModel.js");
const adminModel = require("../models/adminModel.js");
const Investor = require("../models/userInvestorModel.js");
let jwt = require("jsonwebtoken");

module.exports.checkUserAuth = async (req, res, next) => {
  let token;
  const { authorization } = req.headers;
  if (authorization && authorization.startsWith("Bearer")) {
    try {
      // Get Token from header
      token = authorization.split(" ")[1];

      // Verify Token
      const { userID } = jwt.verify(token, process.env.JWT_SECRET_KEY);
      console.log("userId", userID);
      // Get User from Token
      data1 = await modelUser.findById(userID).select("-password");
      data2 = await adminModel.findById(userID).select("-password");
      data3 = await Investor.findById(userID).select("-password");

      if (data1 != null){
        req.user = data1
      }
      if (data2 != null){
        req.user = data2
      }
      if (data3 != null){
        req.user = data3
      }
      
      console.log("middleware", req.user._id);
      if (req.user == null) {
        return res
          .status(401)
          .send({ status: false, message: "Unauthorized User" });
      }
      next();
    } catch (error) {
      console.log("Error2", error);
      res.status(401).send({ status: false, message: "Unauthorized User" });
    }
  }
  if (!token) {
    res
      .status(401)
      .send({ status: false, message: "Unauthorized User, No Token" });
  }
};
