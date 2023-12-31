let investorModel = require("../models/userInvestorModel.js");
let UserModel = require("../models/userStartupModel.js");
let NotificationModel = require("../models/notificationModel.js");
const Admin = require("../models/adminModel.js");
let bcrypt = require("bcrypt");
let jwt = require("jsonwebtoken");
const SendOtp = require("../middlewares/sendOtp.js");
const investorNotification = require("../models/investorNotificationModel.js");
var FCM = require("fcm-node");
const userModels = require("../models/userStartupModel.js");
const Notification = require("../models/notificationModel.js");
const moment = require("moment"); // Import the moment library for date manipulation

const {
  filterDataByMyId,
  filterIntrestedInByMyId,
} = require("./userStartupController.js");
// var serverKey = 'AAAA8LU-rPM:APA91bHIYE9UyPl0k2waaRUfQUZQ-ci0x66hLyPT2X1dv67spaDtc_VHjX7zNtXsDUns9Qvh4IDqGZTrlCiVIexyH2lrVJsdbNEoW_A1jW4yOX3lCtMq6n6BKIRhhwMtKhjV6kiIW7Kk'; //put your server key here
var serverKey =
  "AAAAT8kC-LU:APA91bGXgmVsViWmoAHCc6woyrZtLeQqjx_EBWNMfot_VogJDsusY0HpDTcjVNj1o7CrNvSUbXznuU-UNEgncufmSGzdVIRX9GW04b5PnT17xYsuyzuJD_Irz6mlSrgz_cfsRey4aVGY";

var fcm = new FCM(serverKey);

//signup...................................................................................................
module.exports.signup = async (req, res) => {
  const {
    role,
    investorName,
    email,
    password,
    password_confirmation,
    mobile_token,
    session,
  } = req.body;
  if (email && password) {
    const user = await investorModel.findOne({ email: email });
    const User = await UserModel.findOne({ email: email });
    console.log("data", user);
    if (User) {
      return res.status(201).send({
        success: false,
        status: "201",
        message: "You are register as a StartUp User",
      });
    }
    if (user && user.otp_verified === false) {
      const otp = Math.floor(1000 + Math.random() * 9000);
      let update = await investorModel.findOneAndUpdate(
        { email: email },
        {
          $set: {
            otp: otp,
          },
        },
        { new: true }
      );
      if (update) {
        let datas = SendOtp(email, otp, investorName);
        const token = jwt.sign(
          { userID: user._id },
          process.env.JWT_SECRET_KEY,
          { expiresIn: "5d" }
        );
        let data = user;
        res.status(200).send({
          success: true,
          status: "200",
          message: "Registration Successfully",
          data,
          token: token,
        });
      }
    } else if (user && user.otp_verified === true) {
      res
        .status(401)
        .send({ success: false, status: "401", message: "Already register" });
    } else {
      console.log("password", password);
      console.log("comfirm passsword", password_confirmation);
      if (password === password_confirmation) {
        try {
          const otp = Math.floor(1000 + Math.random() * 9000);
          const salt = await bcrypt.genSalt(10);
          const hashPassword = await bcrypt.hash(password, salt);
          const data = new investorModel({
            investorName: investorName,
            email: email,
            role: role,
            password: hashPassword,
            session: session,
            mobile_token: mobile_token,
            otp: otp,
          });
          let c = await data.save();
          console.log("object", c);
          // Generate JWT Token
          let datas = SendOtp(email, otp, investorName);
          if (datas) {
            const token = jwt.sign(
              { userID: data._id },
              process.env.JWT_SECRET_KEY,
              { expiresIn: "5d" }
            );
            res.status(200).send({
              success: true,
              status: "200",
              message: "Registration Successfully",
              data,
              token: token,
            });
          }
        } catch (error) {
          console.log(error);
          res.status(401).send({
            success: false,
            Status: "401",
            message: "Unable to Register",
          });
        }
      } else {
        res.status(401).send({
          success: false,
          Status: "401",
          message: "Password And password_confirmation Don't Match",
        });
      }
    }
  } else {
    res.status(401).send({
      success: false,
      status: "401",
      message: "All fields are required",
    });
  }
};

//resend...................................................................................................

//Login.........................................................................................................................//
module.exports.Login = async (req, res) => {
  try {
    const { role, email, password, mobile_token } = req.body;
    if (password && email) {
      const data = await investorModel.findOne({ email: email });
      console.log("trolerer", data.role);
      if (!data) {
        return res.status(401).send({
          success: false,
          status: "401",
          message: "Email is not Valid for Investor user",
        });
      }
      if (data.role == role) {
        if (data != null) {
          const isMatch = await bcrypt.compare(password, data.password);
          if (data.otp_verified === false) {
            return res.status(201).send({
              success: false,
              status: "201",
              message: "Please verify otp first",
            });
          } else if (data.email === email && isMatch) {
            await investorModel.findOneAndUpdate(
              { email: email },
              {
                $set: {
                  mobile_token: mobile_token,
                },
              },
              { new: true }
            );
            // Generate JWT Token
            const token = jwt.sign(
              { userID: data._id },
              process.env.JWT_SECRET_KEY,
              { expiresIn: "5d" }
            );
            res.status(200).send({
              success: true,
              status: "200",
              message: "Login Successfully",
              data,
              token: token,
            });
          } else {
            res.status(401).send({
              success: false,
              status: "401",
              message: "Email or Password is not Valid",
            });
          }
        } else {
          res.status(200).send({
            success: false,
            status: "401",
            message: "You are not a Registered User",
          });
        }
      } else {
        res.status(401).send({
          success: false,
          status: "401",
          message: "You are not Investor user",
        });
      }
    } else {
      res.status(401).send({
        success: false,
        status: "401",
        message: "Email or Password are Required",
      });
    }
  } catch (error) {
    console.log(error);
    res
      .status(401)
      .send({ success: false, status: "401", message: "Unable to Login" });
  }
};
//socialRegister...................................................................................................
module.exports.Socialsignup = async (req, res) => {
  const { name, email, mobile_token, social_id, profile_pic, role, session } =
    req.body;
  const user = await investorModel.findOne({ social_id: social_id });
  const users = await investorModel.findOne({ email: email });
  const checkemail = await UserModel.findOne({ email: email });
  if (checkemail) {
    return res.status(200).send({
      success: false,
      Status: "401",
      message: "You are register as a StartUp User",
    });
  }

  console.log("data", user);
  try {
    if (!users) {
      if (user) {
        res.status(200).send({
          success: false,
          Status: "401",
          message: "social_id already exist",
        });
      } else {
        const data = new investorModel({
          name: name,
          email: email,
          mobile_token: mobile_token,
          social_id: social_id,
          profile_pic: profile_pic,
          role: role,
          session: session,
        });
        await data.save();
        const user = await investorModel.findOne({ email: email });
        const token = jwt.sign(
          { userID: user._id },
          process.env.JWT_SECRET_KEY,
          { expiresIn: "5d" }
        );
        res.status(200).send({
          success: true,
          status: "200",
          message: "Registration Successfully",
          data,
          token,
        });
      }
    } else {
      res.status(401).send({
        success: false,
        Status: "401",
        message: "email already exist",
      });
    }
  } catch (error) {
    console.log(error);
    res
      .status(401)
      .send({ success: false, Status: "401", message: "Unable to Register" });
  }
};

//SocialLogin................................................................................................................
module.exports.socialLogin = async (req, res) => {
  try {
    const { email, social_id, mobile_token, role } = req.body;
    const data = await investorModel.find({
      $and: [{ email: email }, { social_id: social_id }],
    });

    console.log("vvvvvvvvvvvvvvvvvvvv", data);
    if (data.length == 0) {
      res.status(401).send({
        success: false,
        status: "401",
        message: "You Does't User Please First Register",
      });
    } else {
      const datas = await investorModel.findOne({
        $and: [{ email: email }, { social_id: social_id }],
      });

      console.log("datasdatasdatasdatas", datas);

      if (datas.role == role) {
        await investorModel.findOneAndUpdate(
          { email: email },
          {
            $set: {
              mobile_token: mobile_token,
            },
          }
        );
        const token = jwt.sign(
          { userID: datas._id },
          process.env.JWT_SECRET_KEY,
          { expiresIn: "5d" }
        );
        res.status(200).send({
          success: true,
          status: "200",
          message: "Login succesfully",
          data,
          token,
        });
      } else {
        res.status(401).send({
          success: false,
          status: "401",
          message: "You are not Investor user",
        });
      }
    }
  } catch (error) {
    res.status(401).send({
      success: false,
      status: "401",
      message: "Something Went Wrongs",
    });
  }
};

//updateSecurityQuestionAndAnswer..........................................................................................
module.exports.updateSecurity = async (req, res) => {
  try {
    var { question, answer } = req.body;
    const data = await investorModel.findByIdAndUpdate(req.user._id, {
      question: question,
      answer: answer,
    });
    if (data) {
      res.status(200).send({
        success: true,
        status: "200",
        message: "update Security succesfully",
        data,
      });
    } else {
      res.status(401).send({
        success: false,
        status: "401",
        message: "Something Went Wrongs",
      });
    }
  } catch (err) {
    res.status(401).send({
      success: false,
      status: "401",
      message: "Something Went Wrongs",
    });
    console.log("err.............=>", err);
  }
};

//updateProfile..........................................................................................
module.exports.updateProfile = async (req, res) => {
  try {
    var {
      chooseIndustry,
      investorStage,
      location,
      roundSize,
      ticketSize,
      bio,
      typeOfInvestor,
      address,
    } = req.body;

    console.log("req.bodyreq.bodyreq.bodyreq.body", req.body);
    let { id } = req.user._id;
    let datas = await investorModel.findById({ _id: req.user._id });
    let profile;
    if (req.file) {
      profile = req?.file?.location;
    } else {
      profile = datas.profile_pic;
    }
    const data = await investorModel.findByIdAndUpdate(
      { _id: req.user._id },

      {
        $set: {
          typeOfInvestor: typeOfInvestor,
          bio: bio,
          location: location,
          address: address,
          roundSize: roundSize,
          ticketSize: ticketSize,
          chooseIndustry: chooseIndustry,
          investorStage: investorStage,
          profile_pic: profile,
        },
      },
      { new: true }
    );
    if (data) {
      res.status(200).send({
        success: true,
        status: "200",
        message: "update Profile succesfully",
        data,
      });
    } else {
      res.status(401).send({
        success: false,
        status: "401",
        message: "Something Went Wrongs",
      });
    }
  } catch (err) {
    res.status(401).send({
      success: false,
      status: "401",
      message: "Something Went Wrongs",
    });
    console.log("err.............=>", err);
  }
};

//getProfile.............................................................
module.exports.GetProfile = async (req, res) => {
  try {
    const data = await investorModel.find(req.user._id);
    if (data) {
      res.status(200).send({
        success: true,
        status: "200",
        message: "Get Profile Succesfully",
        data,
      });
    } else {
      res
        .status(401)
        .send({ status: "failed", message: "Something Went Wrong" });
    }
  } catch (err) {
    console.log("error", err);
  }
};

//Forgot Password.............................................................................................................//
module.exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await investorModel.findOne({ email: email });
    if (!user) {
      return res.status(401).json({
        status: false,
        message: "Email does not exist",
      });
    }
    const otp = Math.floor(1000 + Math.random() * 9000);
    await investorModel.updateOne(
      { email: email },
      {
        $set: {
          otp: otp,
        },
      }
    );
    SendOtp(email, otp, user.investorName);
    return res.status(201).json({
      status: true,
      message: "Otp has been sent to your email, Please check your email",
      response: user,
    });
  } catch (error) {
    return res.status(401).json({
      status: false,
      message: error.message,
    });
  }
};

//*****************************************************************************************************************************/
//resend otp
//****************************************************************************************************************************/

module.exports.resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const otp = Math.floor(1000 + Math.random() * 9000);
    const setemail = await investorModel.findOneAndUpdate(
      { email: email },
      {
        $set: {
          otp: otp,
        },
      },
      { new: true }
    );
    SendOtp(email, otp, setemail.investorName);
    return res.status(201).json({
      status: true,
      message: "Otp has been resent to your email, Please check your email",
      response: setemail,
    });
  } catch (err) {
    return res.status(401).json({
      status: false,
      message: err.message,
      stack: err.stack,
    });
  }
};

//*****************************************************************************************************************************/
////// After Send the Email, Verify Otp API
//****************************************************************************************************************************/
module.exports.verifyotp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log("oooo", req.body);
    const checkemail = await investorModel.findOne({ email: email });
    console.log("test", checkemail);
    if (checkemail.otp !== otp) {
      return res.status(401).json({
        status: false,
        message: "Otp doesn't match",
      });
    } else {
      await investorModel.updateOne(
        { email: email },
        {
          $set: { otp_verified: true, otp: "qwertyuipr" },
        },
        { new: true }
      );
      const checkotp = await investorModel.findOne({ email: email });
      const token = jwt.sign(
        { userID: checkotp._id },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "5d" }
      );

      return res.status(200).json({
        status: true,
        message: "Otp verified successfully",
        response: checkotp,
        token: token,
      });
    }
  } catch (err) {
    return res.status(401).json({
      status: false,
      message: err.message,
    });
  }
};

//VerifySecurityQuestionAndAnswer....................................................................................................../
module.exports.verifySecurity = async (req, res) => {
  try {
    const { answer, question, email } = req.body;
    const datas = await UserModel.find({
      $and: [{ answer: answer }, { question: question }, { email: email }],
    });
    // Generate JWT Token
    const data = await UserModel.findOne({ email: email });
    const token = jwt.sign({ userID: data._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "5d",
    });

    if (datas.length == 0) {
      res.status(401).send({
        success: false,
        status: "401",
        message: "Something Went Wrongs",
      });
    } else {
      res.status(200).send({
        success: true,
        status: "200",
        message: "Question And Answer Verify succesfully",
        data,
        token,
      });
    }
  } catch (error) {
    res.status(401).send({
      success: false,
      status: "401",
      message: "Something Went Wrongs",
    });
    console.log("err.............=>", error);
  }
};

//SetPassword........................................................................................................................
module.exports.setPassword = async (req, res) => {
  const { password, password_confirmation, email } = req.body;
  console.log(req.body);
  try {
    const salt = await bcrypt.genSalt(10);
    const newHashPassword = await bcrypt.hash(password, salt);
    if (password === password_confirmation) {
      const saved_user = await investorModel.findOneAndUpdate(
        { email: email },
        { $set: { password: newHashPassword } }
      );
      if (saved_user) {
        res.status(200).send({
          success: true,
          status: "200",
          message: "Set Password succesfully",
        });
      } else {
        res.status(401).send({
          success: false,
          status: "401",
          message: "Something Went Wrongs",
        });
      }
    } else {
      res.status(401).send({
        success: false,
        status: "401",
        message: "Password And password_confirmation don't Match ",
      });
    }
  } catch (error) {
    res.status(401).send({
      success: false,
      status: "401",
      message: "Something Went Wrongs",
    });
    console.log("error", error);
  }
};

//updateProfilleSetup2............................................................................
module.exports.updateProfileSetup2 = async (req, res) => {
  try {
    var {
      email,
      chooseIndustry,
      investorStage,
      location,
      roundSize,
      ticketSize,
      bio,
      typeOfInvestor,
      address,
    } = req.body;
    const data = await investorModel.findOneAndUpdate(
      { email: email },
      {
        $set: {
          typeOfInvestor: typeOfInvestor,
          bio: bio,
          location: location,
          roundSize: roundSize,
          ticketSize: ticketSize,
          chooseIndustry: chooseIndustry,
          investorStage: investorStage,
          profile_pic: req?.file?.filename,
          address: address,
        },
      },
      { new: true }
    );
    if (data) {
      res.status(200).send({
        success: true,
        status: "200",
        message: "update Profile2 succesfully",
        data,
      });
    } else {
      res.status(401).send({
        success: false,
        status: "401",
        message: "Something Went Wrongs",
      });
    }
  } catch (err) {
    res.status(401).send({
      success: false,
      status: "401",
      message: "Something Went Wrongs",
    });
    console.log("err.............=>", err);
  }
};

//*****************************************************************************************************************************/
//update investor MY profile
//****************************************************************************************************************************/

module.exports.MyProfile = async (req, res, next) => {
  try {
    const { investorName, typeOfInvestor, bio, chooseIndustry, investorStage } =
      req.body;
    let datas = await investorModel.findById({ _id: req.user._id });
    let profile;
    if (req.file) {
      profile = req?.file?.location;
    } else {
      profile = datas.profile_pic;
    }
    const updareprofile = await investorModel.findByIdAndUpdate(
      { _id: req.user._id },
      {
        $set: {
          investorName: investorName ? investorName : datas.investorName,
          typeOfInvestor: typeOfInvestor
            ? typeOfInvestor
            : datas.typeOfInvestor,
          bio: bio ? bio : datas.bio,
          profile_pic: profile,
          chooseIndustry: chooseIndustry
            ? chooseIndustry
            : datas.chooseIndustry,
          investorStage: investorStage ? investorStage : datas.investorStage,
        },
      },
      { new: true }
    );
    return res.status(200).json({
      status: true,
      message: "Profile updated successfully",
      response: updareprofile,
    });
  } catch (err) {
    return res.status(401).json({
      status: false,
      message: err.message,
      stack: err.stack,
    });
  }
};

//*****************************************************************************************************************************/
//fetch investor MY profile
//****************************************************************************************************************************/

module.exports.fetchMyProfile = async (req, res, next) => {
  try {
    const { _id } = req.body;
    const fetchProfile = await investorModel.findOne({ _id: req.user._id });
    return res.status(200).json({
      status: true,
      message: "Profile fetch successfully",
      response: fetchProfile,
    });
  } catch (err) {
    return res.status(401).json({
      status: false,
      message: err.message,
      stack: err.stack,
    });
  }
};

module.exports.fetchStartupUser = async (req, res, next) => {
  const { stStage, location, chooseIndustry, ticketSize } = req.query;

  // Prepare a match object for filtering
  const match = {};

  if (stStage) {
    match.startupStage = { $regex: new RegExp(stStage, "i") };
  }

  if (location) {
    match.location = { $regex: new RegExp(location, "i") };
  }

  if (chooseIndustry) {
    match.chooseIndustry = { $regex: new RegExp(chooseIndustry, "i") };
  }

  if (ticketSize) {
    match.ticketSize = { $regex: new RegExp(ticketSize, "i") };
  }

  try {
    const fetchProfile = await UserModel.aggregate([{ $match: match }]);

    if (fetchProfile.length > 0) {
      return res.status(200).json({
        status: true,
        message: "Profiles fetched successfully",
        response: fetchProfile,
      });
    } else {
      return res.status(201).json({
        status: false,
        message: "No matching profiles found",
        response: [],
      });
    }
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: err.message,
      stack: err.stack,
    });
  }
};

module.exports.fetchInvesterUser = async (req, res, next) => {
  const { stStage, location, chooseIndustry, ticketSize } = req.query;
  const match = {};

  if (stStage) {
    match.startupStage = { $regex: new RegExp(stStage, "i") };
  }

  if (location) {
    match.location = { $regex: new RegExp(location, "i") };
  }

  if (chooseIndustry) {
    match.chooseIndustry = { $regex: new RegExp(chooseIndustry, "i") };
  }

  if (ticketSize) {
    match.ticketSize = { $regex: new RegExp(ticketSize, "i") };
  }
  try {
    const user_id = req.user._id;

    const sentNotifications = await NotificationModel.find({
      user_id: user_id,
    });

    console.log(sentNotifications);
    const recipientIds = sentNotifications.map(
      (notification) => notification.to_send
    );

    const usersNotInNotification = await UserModel.aggregate([
      { $match: { _id: { $nin: recipientIds } } },
      { $match: match },
      { $sample: { size: 100000000 } },
    ]);

    if (usersNotInNotification.length > 0) {
      return res.status(200).json({
        status: true,
        message: "Users fetch successfully",
        response: usersNotInNotification,
      });
    } else {
      return res.status(201).json({
        status: false,
        message: "No users found",
        response: [],
      });
    }
  } catch (err) {
    return res.status(401).json({
      status: false,
      message: err.message,
      stack: err.stack,
    });
  }
};

//*****************************************************************************************************************************/
//update investor Image
//****************************************************************************************************************************/

module.exports.updateImage = async (req, res, next) => {
  try {
    const updareprofile = await investorModel.findByIdAndUpdate(
      { _id: req.user._id },
      {
        $set: {
          profile_pic: req.file.location,
        },
      },
      { new: true }
    );

    return res.status(200).json({
      status: true,
      message: "Image updated successfully",
      response: updareprofile,
    });
  } catch (err) {
    return res.status(401).json({
      status: false,
      message: err.message,
      stack: err.stack,
    });
  }
};

//*****************************************************************************************************************************/
//change investor password
//****************************************************************************************************************************/

module.exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword, cofirmPassword } = req.body;
    console.log("Request Body", req.user);
    const checkpassword = await investorModel.findOne({ _id: req.user._id });
    console.log(checkpassword);
    const comparePassword = await bcrypt.compare(
      oldPassword,
      checkpassword.password
    );

    if (comparePassword == false) throw new Error("Check your old password");

    if (comparePassword == true) {
      if (newPassword !== cofirmPassword)
        throw new Error("check your confirm password");

      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(newPassword, salt);

      const changePassword = await investorModel.findByIdAndUpdate(
        { _id: req.user._id },
        {
          $set: {
            password: hashPassword,
          },
        },
        { new: true }
      );
      console.log("changePassword", changePassword);
      return res.status(200).json({
        status: true,
        message: "Password change successfully",
        response: changePassword,
      });
    }
  } catch (err) {
    console.log("Error message", err.message);
    return res.status(401).json({
      status: false,
      message: err.message,
      stack: err.stack,
    });
  }
};

//*****************************************************************************************************************************/
//sent notification
//****************************************************************************************************************************/

module.exports.sentNotification = async (req, res) => {
  try {
    const { user_id } = req.body;
    const User = await userModels.findOne({ _id: user_id });
    const loginUser = await investorModel.findOne({ _id: req.user._id });
    console.log("login", loginUser.investorName, "user", User.count);
    const admin = await Admin.find();
    if (loginUser.count >= admin[0].swipeCount) {
      return res.status(429).json({
        status: false,
        message: "You have reached the limit of sending notifications",
      });
    }

    const Notificationcreate = await Notification.create({
      user_id: req.user._id,
      to_send: user_id,
      title: `${loginUser.investorName}is intersted in connecting with you`,
    });

    if (!User?.intrestedIn) User.intrestedIn = [];
    User.intrestedIn.push(user_id);
    const updateThisUserForIntrestedInUser =
      await investorModel.findByIdAndUpdate(req.user._id, {
        $set: { intrestedIn: [...User.intrestedIn] },
      });

    var message = {
      to: User.mobile_token,
      notification: {
        title: "notification",
        body: `${loginUser.investorName} is intersted in connecting with you`,
      },
    };

    // const modify = await investorModel.findByIdAndUpdate(loginUser._id, {
    //   $inc: { count: 1 }, // Increment the count field by 1
    // });

    if (User.mobileNotify) {
      fcm.send(message, async (err, response) => {
        if (err) {
          console.log("Something has gone wrong!");
          return res.status(402).json({
            message: `Notification Not successfully ${err.message}`,
          });
        } else {
          console.log("Successfully sent with response: ", response.send);
          return res.status(200).json({
            message: "Notification sent successfully",
          });
        }
      });
    } else {
      return res
        .status(200)
        .json({ message: "Notification sent successfully" });
    }
  } catch (err) {
    return res.status(401).json({
      status: false,
      message: err.message,
      stack: err.stack,
    });
  }
};

//*****************************************************************************************************************************/
//fetch notification
//****************************************************************************************************************************/

// module.exports.fetchNotification = async (req, res, next) => {
//   try {
//     const user_id = req.user._id;
//     const fetchNotification = await investorNotification
//       .find({ to_send: user_id })
//       .populate("user_id")
//       .sort({ createdAt: -1 });

//     fetchNotification.forEach((notification) => {
//       const createdAt = moment(notification.createdAt);

//       console.log("Notification createdAt:", createdAt.format());

//       if (createdAt.isSame(moment(), "day")) {
//         notification.date = "today";
//         console.log("Date is today",notification.date);
//       } else if (createdAt.isSame(moment().subtract(1, "day"), "day")) {
//         console.log("Date is yesterday");
//         notification.date = "yesterday";
//       } else if (createdAt.isBetween(moment().subtract(7, "days"), moment())) {
//         console.log("Date is within the last week");
//         notification.date = "week";
//       } else if (createdAt.isBetween(moment().subtract(1, "month"), moment())) {
//         console.log("Date is within the last month");
//         notification.date = "month";
//       }
//     });

//     console.log(">>>>>>>", fetchNotification);

//     if (fetchNotification.length === 0) {
//       return res.status(409).json({ message: "No data found", status: false });
//     }
//     return res.status(200).json({
//       status: true,
//       message: "Notification fetch successfully",
//       response: fetchNotification,
//     });
//   } catch (err) {
//     return res.status(401).json({
//       status: false,
//       message: err.message,
//       stack: err.stack,
//     });
//   }
// };

module.exports.fetchNotification = async (req, res, next) => {
  try {
    const user_id = req.user._id;
    const fetchNotification = await investorNotification
      .find({ to_send: user_id })
      .populate("user_id")
      .sort({ createdAt: -1 });

    if (fetchNotification.length === 0) {
      return res.status(409).json({ message: "No data found", status: false });
    }

    const transformedNotifications = fetchNotification.map((notification) => {
      const createdAt = moment(notification.createdAt);
      let date = "";

      if (createdAt.isSame(moment(), "day")) {
        date = "today";
      } else if (createdAt.isSame(moment().subtract(1, "day"), "day")) {
        date = "yesterday";
      } else if (createdAt.isBetween(moment().subtract(7, "days"), moment())) {
        date = "week";
      } else if (createdAt.isBetween(moment().subtract(1, "month"), moment())) {
        date = "month";
      }

      return { ...notification.toObject(), date }; // Add date property
    });

    return res.status(200).json({
      status: true,
      message: "Notification fetch successfully",
      response: transformedNotifications,
    });
  } catch (err) {
    return res.status(401).json({
      status: false,
      message: err.message,
      stack: err.stack,
    });
  }
};

module.exports.acceptRequest = async (req, res, next) => {
  try {
    console.log(req.body);
    const { user_id, _id } = req.body;
    const User = await userModels.findOne({ _id: user_id });
    const loginUser = await investorModel.findOne({ _id: req.user._id });

    const Notificationcreate = await Notification.create({
      user_id: req.user._id,
      to_send: user_id,
      title: `${loginUser.investorName} started following you`,
      status: "accept",
    });

    let acceptNotfication = await investorNotification.findByIdAndUpdate(
      { _id: _id },
      {
        $set: {
          status: "accept",
          title: `${User.startupName} started following you`,
        },
      }
    );

    // //used to insert user in user model interseted
    // loginUser.intrestedIn.includes(Notificationcreate.to_send)
    //   ? console.log(``)
    //   : await UserModel.findByIdAndUpdate(
    //       { _id: req.user._id },
    //       { $push: { intrestedIn: startUpRequestAccept.to_send } }
    //     );

    // //we also need to insert that particular user in invested also-->
    // User.intrestedIn.includes(startUpRequestAccept.to_send)
    //   ? console.log(``)
    //   : await investorModel.findByIdAndUpdate(
    //       {
    //         _id: Notificationcreate.to_send,
    //       },
    //       { $push: { intrestedIn: req.user._id } }
    //     );


    var message = {
      to: User.mobile_token,
      notification: {
        title: "notification",
        body: `${loginUser.investorName} started following you`,
      },
    };
    if (User.mobileNotify) {
      fcm.send(message, function (err, response) {
        if (err) {
          console.log("Something has gone wrong!");
          return res.status(402).json({
            message: "Notification Not successfully",
          });
        } else {
          console.log("Successfully sent with response: ", response);
          return res.status(200).json({
            message: "Notification sent successfully",
            response: User,
          });
        }
      });
    } else {
      return res.status(200).json({
        message: "Notification sent successfully",
        response: User,
      });
    }
  } catch (err) {
    return res.status(401).json({
      status: false,
      message: err.message,
      stack: err.stack,
    });
  }
};

module.exports.NoficationInvester = async (req, res, next) => {
  try {
    const loginUser = await NotificationModel.find({ user_id: req.user._id });
    return (
      res,
      status(200).json({
        status: true,
        message: "List of notifications",
        data: loginUser,
      })
    );
  } catch (err) {
    return res.status(401).json({
      status: false,
      message: err.message,
      stack: err.stack,
    });
  }
};

//*****************************************************************************************************************************/
//reject request
//****************************************************************************************************************************/

module.exports.rejectedRequest = async (req, res, next) => {
  try {
    const { _id } = req.body;
    const investornotificationReq = await investorNotification.findById(_id);
    const intrestedStartup = await userModels.findById(
      investornotificationReq.user_id
    );
    filterIntrestedInByMyId(req.user._id, intrestedStartup);
    await userModels.findByIdAndUpdate(investornotificationReq.user_id, {
      $set: {
        intrestedIn: intrestedStartup.intrestedIn,
      },
    });
    await investorNotification.findByIdAndDelete({
      _id: _id,
    });
    return res.status(200).json({
      status: true,
      message: "request rejected successfully",
    });
  } catch (err) {
    return res.status(401).json({
      status: false,
      message: err.message,
      stack: err.stack,
    });
  }
};

//*****************************************************************************************************************************/
//filter request
//****************************************************************************************************************************/
// module.exports.filterInvestorData = async (req, res, next) => {
//   const { stStage, location, chooseIndustry, ticketSize } = req.query;
//   console.log(req.query);
//   try {
//     let match = {};
//     if (stStage) {
//       match.startupStage = new RegExp(stStage, "i");
//     }
//     if (location) {
//       match.location = new RegExp(location, "i");
//     }
//     if (chooseIndustry) {
//       match.chooseIndustry = new RegExp(chooseIndustry, "i");
//     }
//     if (ticketSize) {
//       match.ticketSize = new RegExp(ticketSize, "i");
//     }
//     const fetchProfile = await UserModel.aggregate([{ $match: match }]);

//     return res.status(200).json({
//       status: true,
//       response: fetchProfile,
//     });
//   } catch (err) {
//     return res.status(401).json({
//       status: false,
//       message: err.message,
//       stack: err.stack,
//     });
//   }
// };
