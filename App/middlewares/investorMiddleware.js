let modelUser = require("../models/userInvestorModel.js");
let jwt = require("jsonwebtoken");

module.exports.checkUserAuth = async (req, res, next) => {
  let token;
  const { authorization } = req.headers;
  if (authorization && authorization.startsWith("Bearer")) {
    try {
      // Get Token from header
      token = authorization.split(" ")[1];
      console.log('token',token);
      // Verify Token
      const { userID } = jwt.verify(token, process.env.JWT_SECRET_KEY);
      console.log("userId", userID);
      // Get User from Token
      req.user = await modelUser.findById(userID).select("-password");
      console.log("middleware", req.user);
      if (req.user == null) {
        return res
          .status(401)
          .send({ status: false, message: "Unauthorized User" });
      }
      next();
    } catch (error) {
      console.log("what error..................", error);
      res.status(401).send({ status: false, message: "Unauthorized User" });
    }
  }
  if (!token) {
    res
      .status(401)
      .send({ status: false, message: "Unauthorized User, No Token" });
  }
};
