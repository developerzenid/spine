let UserModel = require("../models/userStartupModel.js");
let investorModel = require("../models/userInvestorModel.js");
let NotificationModel = require("../models/notificationModel.js");
let statUpAcceptModel = require("../models/startUpRequestAcceptModel.js");
let investorNotificationModel = require("../models/investorNotificationModel.js");
const Chat = require("../models/socketmessage.js");
const moment = require("moment"); // Import the moment library for date manipulation
const process = require("process");
let bcrypt = require("bcrypt");
let jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const SendOtp = require("../middlewares/sendOtp.js");
var FCM = require("fcm-node");
// var serverKey = 'AAAA8LU-rPM:APA91bHIYE9UyPl0k2waaRUfQUZQ-ci0x66hLyPT2X1dv67spaDtc_VHjX7zNtXsDUns9Qvh4IDqGZTrlCiVIexyH2lrVJsdbNEoW_A1jW4yOX3lCtMq6n6BKIRhhwMtKhjV6kiIW7Kk'; //put your server key here
var serverKey =
  "AAAAT8kC-LU:APA91bGXgmVsViWmoAHCc6woyrZtLeQqjx_EBWNMfot_VogJDsusY0HpDTcjVNj1o7CrNvSUbXznuU-UNEgncufmSGzdVIRX9GW04b5PnT17xYsuyzuJD_Irz6mlSrgz_cfsRey4aVGY";
//last "AAAA6NG_HkA:APA91bHqg8o_zY_dTOwMY7TnRvnFmRfxFsnyMRYusap93ykcunsImWKwyPzhthzwroCkT0v4EQbztjThkdBFof_XIfRvcJZN_ejnPqHNOl93lunjvAMnCGt9wRoIOisUh17Xz1mtGLsV";
// var serverKey="AAAAykjCpRU:APA91bGWtlwydzaW13DwPJm7vAjSLw1y58oXK0dySLKKZvWAivFHJMvzOOx6c9Zr1otGirkS0MvwYd0iNmmbEE-6iQY_qXGxaDeO2BjlqdZ3Ums6jAuAfQjB5lemh9ly2TpcNVgNumT7"
var fcm = new FCM(serverKey);

const notification = require("../models/notificationModel.js");
const { status } = require("init");
const { ObjectId } = require("mongodb");
const investorModels = require("../models/userInvestorModel.js");

//chooseRole............................................................................................

//signup...................................................................................................
module.exports.signup = async (req, res) => {
  console.log(".....................", req.body);
  const {
    role,
    startupName,
    email,
    password,
    password_confirmation,
    mobile_token,
    session,
  } = req.body;
  console.log(".....................", req.body);
  if (email && password) {
    const user = await UserModel.findOne({ email: email });
    const investor = await investorModel.findOne({ email: email });
    if (investor) {
      res.status(201).send({
        success: false,
        status: "201",
        message: "You are register as a Investor User",
      });
    }
    console.log("data", user);
    if (user && user.otp_verified === false) {
      const otp = Math.floor(1000 + Math.random() * 9000);
      let update = await UserModel.findOneAndUpdate(
        { email: email },
        {
          $set: {
            otp: otp,
          },
        },
        { new: true }
      );
      if (update) {
        let datas = SendOtp(email, otp, startupName);
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
      if (password === password_confirmation) {
        try {
          const salt = await bcrypt.genSalt(10);
          const hashPassword = await bcrypt.hash(password, salt);
          const otp = Math.floor(1000 + Math.random() * 9000);

          const data = new UserModel({
            startupName: startupName,
            email: email,
            role: role,
            password: hashPassword,
            mobile_token: mobile_token,
            session: session,
            otp: otp,
          });
          await data.save();
          // Generate JWT Token
          let datas = SendOtp(email, otp, startupName);
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
//Login.........................................................................................................................//
module.exports.Login = async (req, res) => {
  try {
    const { role, email, password, mobile_token } = req.body;
    if (password && email) {
      const data = await UserModel.findOne({ email: email });
      if (!data) {
        return res.status(401).send({
          success: false,
          status: "401",
          message: "Email is not Valid for startup user",
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
            await UserModel.findOneAndUpdate(
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
            return res.status(200).send({
              success: true,
              status: "200",
              message: "Login Successfully",
              data,
              token: token,
            });
          } else {
            return res.status(401).send({
              success: false,
              status: "401",
              message: "Email or Password is not Valid",
            });
          }
        } else {
          return res.status(200).send({
            success: false,
            status: "401",
            message: "You are not a Registered User",
          });
        }
      }
      {
        return res.status(200).send({
          success: false,
          status: "401",
          message: "You are not startup user",
        });
      }
    } else {
      return res.status(401).send({
        success: false,
        status: "401",
        message: "Email or Password are Required",
      });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(401)
      .send({ success: false, status: "401", message: "Unable to Login" });
  }
};
//updateSecurityQuestionAndAnswer..........................................................................................
module.exports.updateSecurity = async (req, res) => {
  try {
    var { question, answer } = req.body;
    const data = await UserModel.findByIdAndUpdate(req.user._id, {
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
//socialRegister...................................................................................................
module.exports.Socialsignup = async (req, res) => {
  const { name, email, mobile_token, social_id, profile_pic, role, session } =
    req.body;
  const user = await UserModel.findOne({ social_id: social_id });
  const users = await UserModel.findOne({ email: email });
  const checkemail = await investorModel.findOne({ email: email });
  if (checkemail) {
    return res.status(200).send({
      success: false,
      Status: "401",
      message: "You are register as a Investor User",
    });
  }
  try {
    if (!users) {
      if (user) {
        res.status(200).send({
          success: false,
          Status: "401",
          message: "social_id already exist",
        });
      } else {
        const data = new UserModel({
          name: name,
          email: email,
          mobile_token: mobile_token,
          social_id: social_id,
          profile_pic: profile_pic,
          role: role,
          session: session,
        });
        await data.save();
        const user = await UserModel.findOne({ email: email });
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
    const data = await UserModel.find({
      $and: [{ email: email }, { social_id: social_id }],
    });

    if (data.length == 0) {
      res.status(401).send({
        success: false,
        status: "401",
        message: "You Does't User Please First Register",
      });
    } else {
      const datas = await UserModel.findOne({
        $and: [{ email: email }, { social_id: social_id }],
      });

      console.log("datasdatasdatasdatas", datas);

      if (datas.role == role) {
        await UserModel.findOneAndUpdate(
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
          message: "You are not Startup user",
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
//ChangePassword......................................................................................................................./
module.exports.changePassword = async (req, res) => {
  const { newPassword, password_confirmation } = req.body;
  const password = req.body.currentPassword;
  try {
    const users = await UserModel.findById(req.user._id);
    console.log(users);
    const isMatch = await bcrypt.compare(password, users.password);
    console.log("data1", isMatch);
    if (isMatch == true) {
      if (newPassword && password_confirmation) {
        if (newPassword !== password_confirmation) {
          res.status(401).send({
            success: false,
            status: "401",
            message: "New Password and Confirm New Password doesn't match",
          });
        } else {
          const salt = await bcrypt.genSalt(10);
          const newHashPassword = await bcrypt.hash(newPassword, salt);
          await UserModel.findByIdAndUpdate(req.user._id, {
            $set: { password: newHashPassword },
          });
          res.status(200).send({
            success: true,
            status: "200",
            message: "Password changed succesfully",
          });
        }
      } else {
        res.status(401).send({
          success: false,
          status: "401",
          message: "All Fields are Required",
        });
      }
    } else {
      res.status(401).send({ message: "Old Password is Wrong" });
    }
  } catch (error) {
    res.status(401).send({
      success: false,
      status: "401",
      message: "Something Went  Wrong",
    });
  }
};

//Forgot Password.............................................................................................................//
// module.exports.forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body
//     const data = await UserModel.find({ email: email })
//     if (data.length == 0) {
//       res.status(401).send({ "success": false, "status": "401", "message": "You Does't User Please First Register" })
//     } else {
//       res.status(200).send({ "success": true, "status": "200", "message": "email Verify succesfully" })
//     }
//   } catch (error) {
//     res.status(401).send({ "success": false, "status": "401", "message": "Something Went Wrongs" })
//     console.log("err.............=>", err);
//   }
// }

//*****************************************************************************************************************************/
////// Forgot Password API
//****************************************************************************************************************************/
module.exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await UserModel.findOne({ email: email });
    if (!user) {
      return res.status(401).json({
        status: false,
        message: "Email does not exist",
      });
    }
    const otp = Math.floor(1000 + Math.random() * 9000);
    await UserModel.updateOne(
      { email: email },
      {
        $set: {
          otp: otp,
        },
      }
    );
    SendOtp(email, otp, user.name);
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
    const setemail = await UserModel.findOneAndUpdate(
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
    const checkemail = await UserModel.findOne({ email: email });
    if (checkemail.otp !== otp) {
      return res.status(401).json({
        status: false,
        message: "Otp doesn't match",
      });
    } else {
      await UserModel.updateOne(
        { email: email },
        {
          $set: { otp_verified: true, otp: "qwertyuip" },
        },
        { new: true }
      );
      const checkotp = await UserModel.findOne({ email: email });
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
    //console.log("data....................",data);
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
      const saved_user = await UserModel.findOneAndUpdate(
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

//update..................................................................................
module.exports.updateProfile = async (req, res) => {
  try {
    var {
      description,
      email,
      startupName,
      startupStage,
      pitchDeckLink,
      founderName,
      chooseIndustry,
      location,
      teamSize,
      BusinessModel,
      fundRaise,
      pitchDeck,
      roundSize,
      ticketSize,
      address,
    } = req.body;
    const data = await UserModel.findOneAndUpdate(
      { _id: req.user._id },
      {
        $set: {
          description: description,
          startupName: startupName,
          email: email,
          founderName: founderName,
          profile_pic:
            req?.files?.profile_pic == undefined
              ? ""
              : req?.files?.profile_pic[0]?.location,
          chooseIndustry: chooseIndustry,
          startupStage: startupStage,
          location: location,
          teamSize: teamSize,
          BusinessModel: BusinessModel,
          fundRaise: fundRaise,
          pitchDeck:
            req?.files?.pitchDeck == undefined
              ? ""
              : req?.files?.pitchDeck[0]?.location,
          pitchDeckLink: pitchDeckLink,
          ticketSize: ticketSize,
          roundSize: roundSize,
          address: address,
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

//get......................................................................................................
module.exports.GetProfile = async (req, res) => {
  try {
    const data = await UserModel.find(req.user._id);
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

//setIndustry................................................................................................
module.exports.setIndustry = async (req, res) => {
  try {
    var { chooseIndustry, startupStage, location } = req.body;
    const data = await UserModel.findByIdAndUpdate(req.user._id, {
      chooseIndustry: chooseIndustry,
      startupStage: startupStage,
      location: location,
    });
    if (data) {
      res.status(200).send({
        success: true,
        status: "200",
        message: "update setIndustry  succesfully",
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

//fundingteam....................................................................
module.exports.setfundingTeam = async (req, res) => {
  try {
    var { teamSize, BusinessModel, fundRaise, pitchDeck } = req.body;
    const data = await UserModel.findByIdAndUpdate(req.user._id, {
      teamSize: teamSize,
      BusinessModel: BusinessModel,
      fundRaise: fundRaise,
      pitchDeck: pitchDeck,
    });
    if (data) {
      res.status(200).send({
        success: true,
        status: "200",
        message: "update setFundingTeam succesfully",
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

//fundRaising..........................................................................................
module.exports.setfundRaising = async (req, res) => {
  try {
    var { roundSize, ticketSize } = req.body;
    const data = await UserModel.findByIdAndUpdate(req.user._id, {
      roundSize: roundSize,
      ticketSize: ticketSize,
    });
    if (data) {
      res.status(200).send({
        success: true,
        status: "200",
        message: "update setFundraise succesfully",
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
//update startup MY profile
//****************************************************************************************************************************/

module.exports.startupMyProfile = async (req, res, next) => {
  try {
    const {
      startupName,
      founderName,
      email,
      description,
      chooseIndustry,
      startupStage,
      teamSize,
      BusinessModel,
    } = req.body;
    let datas = await UserModel.findById({ _id: req.user._id });
    let profile;
    if (req.file) {
      profile = req?.file?.location;
    } else {
      profile = datas.profile_pic;
    }
    const updareprofile = await UserModel.findByIdAndUpdate(
      { _id: req.user._id },
      {
        $set: {
          startupName: startupName ? startupName : datas.startupName,
          founderName: founderName ? founderName : datas.founderName,
          email: email ? email : datas.email,
          description: description ? description : datas.description,
          profile_pic: profile,
          chooseIndustry: chooseIndustry
            ? chooseIndustry
            : datas.chooseIndustry,
          startupStage: startupStage ? startupStage : datas.startupStage,
          teamSize: teamSize ? teamSize : datas.teamSize,
          BusinessModel: BusinessModel ? BusinessModel : datas.BusinessModel,
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
//fetch  MY profile
//****************************************************************************************************************************/

module.exports.fetchMyProfile = async (req, res, next) => {
  try {
    const { _id } = req.body;
    console.log("object", req.user._id);
    const fetchProfile = await UserModel.findOne({ _id: req.user._id });
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

// module.exports.filterDataByMyId = (myId, data) => {
//   let newData = data;

//   const id = newData[0]._id;
//   console.log("newData", newData);

//   const myObjectId = new ObjectId(myId);
//   console.log("myobjid", myObjectId);
//   console.log("dataId", id);

//   return newData.filter(
//     (item) =>
//       !item.intrestedIn.find((id) => id.toString() === myObjectId.toString())
//   );
// };

module.exports.fetchInvestorupUser = async (req, res, next) => {
  try {
    const user_id = req.user._id;

    const sentNotifications = await investorNotificationModel.find({
      user_id: user_id,
    });

    console.log(
      ">>>>>>>>>>>>>>>>> send notification >>>>>>>>>>>>>>",
      sentNotifications
    );
    // Extract the recipient user IDs from sentNotifications
    const recipientIds = sentNotifications.map(
      (notification) => notification.to_send
    );
    console.log("receipt ids that contain user id >>>>>> ", recipientIds);

    const usersNotInNotification = await investorModel.aggregate([
      { $match: { _id: { $nin: recipientIds } } },
      { $match: { otp_verified: true } },
      { $sample: { size: 100000000 } },
    ]);
    console.log("user not notification", usersNotInNotification);

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
    console.log("err1", err.message);
    return res.status(401).json({
      status: false,
      message: err.message,
      stack: err.stack,
    });
  }
};

// ============================================================================
// filter startup data
// ============================================================================

module.exports.filterStartupData = async (req, res, next) => {
  const { stStage, location, chooseIndustry, ticketSize } = req.query;
  console.log(req.query);
  try {
    let match = {};
    if (stStage) {
      match.startupStage = new RegExp(stStage, "i");
    }
    if (location) {
      match.location = new RegExp(location, "i");
    }
    if (chooseIndustry) {
      match.chooseIndustry = new RegExp(chooseIndustry, "i");
    }
    if (ticketSize) {
      match.ticketSize = new RegExp(ticketSize, "i");
    }
    const fetchProfile = await investorModel.aggregate([{ $match: match }]);

    return res.status(200).json({
      status: true,
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

module.exports.fetchAllInvesterUser = async (req, res, next) => {
  try {
    const { stStage, location, chooseIndustry, ticketSize } = req.query;
    console.log(req.query);
      let match = {};
      if (stStage) {
        match.startupStage = new RegExp(stStage, "i");
      }
      if (location) {
        match.location = new RegExp(location, "i");
      }
      if (chooseIndustry) {
        match.chooseIndustry = new RegExp(chooseIndustry, "i");
      }
      if (ticketSize) {
        match.ticketSize = new RegExp(ticketSize, "i");
      }
      const fetchProfile = await investorModel.aggregate([{ $match: match }])

    console.log("object", fetchProfile.length);
    if (fetchProfile.length > 0) {
      return res.status(200).json({
        status: true,
        message: "Profile all fetch successfully",
        response: fetchProfile,
      });
    } else {
      return res.status(201).json({
        status: false,
        message: "Profile all fetch successfully",
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
//update startup Image
//****************************************************************************************************************************/

module.exports.updateStartupImage = async (req, res, next) => {
  try {
    // console.log(req.file)
    console.log("usersid", req.user);
    console.log("userwerewsid", req.file);
    const updareprofile = await UserModel.findByIdAndUpdate(
      { _id: req.user._id },
      {
        $set: {
          profile_pic: req.file.location,
          // profile_pic: req.file.location,
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
//change startup password
//****************************************************************************************************************************/

module.exports.changeStartupPassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword, cofirmPassword } = req.body;
    console.log("change Password", req.user);

    const checkpassword = await UserModel.findOne({ _id: req.user._id });

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

      const changePassword = await UserModel.findByIdAndUpdate(
        { _id: req.user._id },
        {
          $set: {
            password: hashPassword,
          },
        },
        { new: true }
      );

      return res.status(200).json({
        status: true,
        message: "Password change successfully",
        response: changePassword,
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
//sent notification
//****************************************************************************************************************************/

module.exports.sentNotification = async (req, res, next) => {
  try {
    const { user_id } = req.body;
    const User = await investorModel.findOne({ _id: user_id });
    const loginUser = await UserModel.findOne({ _id: req.user._id });
    console.log("login", loginUser.count, "user", User.count);
    if (loginUser.count >= process.env.COUNT_LIMIT) {
      return res.status(429).json({
        status: false,
        message: "You have reached the limit of sending notifications",
      });
    }

    const Notificationcreate = await investorNotificationModel.create({
      user_id: req.user._id,
      to_send: user_id,
      title: `is intersted in connecting with you`,
    });

    console.log(loginUser);

    if (!User?.intrestedIn) User.intrestedIn = [];
    User.intrestedIn.push(user_id);

    const updateThisUserForIntrestedInUser = await UserModel.findByIdAndUpdate(
      req.user._id,
      { $set: { intrestedIn: [...User.intrestedIn] } }
    );

    var message = {
      to: User.mobile_token,
      notification: {
        title: "notification",
        body: `is intersted in connecting with you`,
      },
    };

    // const modify = await UserModel.findByIdAndUpdate(loginUser._id, {
    //   $inc: { count: 1 }, // Increment the count field by 1
    // });

    console.log("fcm", fcm);
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
          });
        }
      });
      console.log("Done");
    } else {
      return res
        .status(501)
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

module.exports.fetchNotification = async (req, res, next) => {
  try {
    const user_id = req.user._id;
    const fetchNotification = await notification
      .find({ to_send: user_id })
      .populate("user_id")
      .sort({ createdAt: -1 });

    console.log(fetchNotification);

    const today = moment();
    const yesterday = moment().subtract(1, "day");
    const oneWeekAgo = moment().subtract(7, "days");
    const oneMonthAgo = moment().subtract(1, "month");

    const categorizedNotifications = {
      today: [],
      yesterday: [],
      week: [],
      month: [],
    };

    fetchNotification.forEach((notification) => {
      const createdAt = moment(notification.createdAt);

      if (createdAt.isSame(today, "day")) {
        categorizedNotifications.today.push(notification);
      } else if (createdAt.isSame(yesterday, "day")) {
        categorizedNotifications.yesterday.push(notification);
      } else if (createdAt.isBetween(oneWeekAgo, today)) {
        categorizedNotifications.week.push(notification);
      } else if (createdAt.isBetween(oneMonthAgo, today)) {
        categorizedNotifications.month.push(notification);
      }
    });

    if (
      [
        ...categorizedNotifications.today,
        ...categorizedNotifications.yesterday,
        ...categorizedNotifications.week,
        ...categorizedNotifications.month,
      ].length === 0
    ) {
      return res.status(409).json({ message: "No data found", status: false });
    }
    return res.status(200).json({
      status: true,
      message: "Notification sent successfully",
      reponse: [
        {
          today: categorizedNotifications.today,
          yesterday: categorizedNotifications.yesterday,
          week: categorizedNotifications.week,
          month: categorizedNotifications.month,
        },
      ],
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
    const { user_id, _id } = req.body;
    const User = await investorModel.findOne({ _id: user_id });
    console.log("User", User);
    console.log("User toklen", User.mobile_token);
    console.log(req.user._id);
    const loginUser = await UserModel.find({ _id: req.user._id });

    let newUser = { ...loginUser };
    console.log(">>>>>>>new user", newUser);

    const Notificationcreate = await investorNotificationModel.create({
      user_id: req.user._id,
      to_send: user_id,
      title: `${newUser[0].startupName} started following you`,
      status: "accept",
    });
    console.log(Notificationcreate);

    const startUpRequestAccept = await notification.findByIdAndUpdate(
      { _id: _id },
      { $set: { status: "accept", title: "Started following you" } }
    );
    if (!startUpRequestAccept) {
      console.log("notification");
    }

    // //used to insert user in user model interseted
    // loginUser.intrestedIn.includes(Notificationcreate.to_send)
    //   ? console.log(``)
    //   :  await UserModel.findByIdAndUpdate(
    //       { _id: req.user._id },
    //       { $push: { intrestedIn: startUpRequestAccept.to_send } }
    //     );

    // //we also need to insert that particular user in invested also-->
    // User.intrestedIn.includes(startUpRequestAccept.to_send)
    //   ? console.log(``)
    //   : await investorModel.findByIdAndUpdate({
    //       _id: Notificationcreate.to_send,
    //     },{$push:{intrestedIn:req.user._id}});

    var message = {
      to: User.mobile_token,
      notification: {
        title: "notification",
        body: `${newUser[0].startupName} started following you`,
      },
    };
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
        });
      }
    });
  } catch (err) {
    return res.status(401).json({
      status: false,
      message: err.message,
      stack: err.stack,
    });
  }
};

module.exports.NoficationStatupStartUp = async (req, res, next) => {
  try {
    const loginUser = await NotificationModel.find({ user_id: req.user._id });
    return res.status(200).json({
      status: true,
      message: "List of notifications",
      data: loginUser,
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
//reject request
//****************************************************************************************************************************/

module.exports.rejectedRequest = async (req, res, next) => {
  try {
    const { _id } = req.body;

    const notificationReq = await notification.findById(_id);
    const intrestedInvestor = await investorModel.findById(
      notificationReq.user_id
    );
    this.filterIntrestedInByMyId(req.user._id, intrestedInvestor);
    await investorModel.findByIdAndUpdate(notificationReq.user_id, {
      $set: {
        intrestedIn: intrestedInvestor.intrestedIn,
      },
    });
    await notification.findByIdAndDelete({ _id: _id });
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

module.exports.filterIntrestedInByMyId = (myId, data) => {
  if (data.intrestedIn && Array.isArray(data.intrestedIn)) {
    data.intrestedIn = data.intrestedIn.filter((id) => !id.equals(myId));
  }
};

module.exports.getCardData = async (req, res) => {
  try {
    const _id = req.query.id;
    console.log(`>>>>>>>>> ${_id}  >>>>>>>`);
    const findUser =
      (await investorModel.findById(_id)) || (await UserModel.findById(_id));
    res.status(201).json({
      status: true,
      message: `Card user fetch successfully`,
      data: findUser,
    });
  } catch (err) {
    return res.status(401).json({
      status: false,
      message: err.message,
      stack: err.stack,
    });
  }
};

module.exports.acceptUser = async (req, res) => {
  try {
    console.log(req.user._id);
    const id = req.user._id;

    const user = await NotificationModel.aggregate([
      {
        $match: {
          user_id: id,
          status: "accept",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "to_send",
          foreignField: "_id",
          as: "about",
        },
      },
      {
        $match: {
          about: { $not: { $size: 0 } },
        },
      },
    ]);

    const data = await investorNotificationModel.aggregate([
      {
        $match: {
          user_id: id,
          status: "accept",
        },
      },
      {
        $lookup: {
          from: "investors",
          localField: "to_send",
          foreignField: "_id",
          as: "about",
        },
      },
      {
        $match: {
          about: { $not: { $size: 0 } },
        },
      },
    ]);
    console.log(">>>>>>>>>>>>>user", user);
    console.log(">>>>>>>>>>>>>data", data);

    const finalResult = [...user, ...data];

    if (finalResult.length !== 0) {
      console.log(">>>>>>>>>>>");
      return res.status(201).json({
        status: true,
        message: `Accepted users`,
        data: finalResult,
      });
    } else {
      return res
        .status(200)
        .json({ status: false, message: "users", data: finalResult });
    }
  } catch (err) {
    return res.status(401).json({
      status: false,
      message: err.message,
      stack: err.stack,
    });
  }
};

exports.fetchChat = async (req, res) => {
  try {
    console.log(
      `>>>>>>>>> Fetch chat Login chat  ${req.user._id}  receiver  ${req.query.to_send} >>>>>>>>>>`
    );
    if (!req.query.to_send) {
      return res.status(500).json({ error: "Did not get receiver Id" });
    }
    const send = await Chat.find({
      user_id: req.user._id,
      to_send: req.query.to_send,
    }).sort({ createdAt: -1 });

    const recieve = await Chat.find({
      user_id: req.query.to_send,
      to_send: req.user._id,
    }).sort({ createdAt: -1 });

    console.log(`>>>>>>>>>>>  Response Message send ${send}  
    >>>>>>>>>>>   Recieve ${recieve}`);

    const sendMessages = send.map((message) => ({
      ...message.toObject(),
      status: "sender",
      time: formatTime(message.createdAt),
    }));

    const receiveMessages = recieve.map((message) => ({
      ...message.toObject(),
      status: "receiver",
      time: formatTime(message.createdAt),
    }));

    const result = [...sendMessages, ...receiveMessages].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    console.log(result);

    if (result.length === 0) {
      return res
        .status(200)
        .json({ status: false, message: "Chat messages", data: result });
    }

    res.status(200).json({
      status: true,
      message: `Chat messages`,
      data: result,
    });
  } catch (err) {
    return res.status(401).json({
      status: false,
      message: err.message,
      stack: err.stack,
    });
  }
};

function formatTime(date) {
  const options = { hour: "2-digit", minute: "2-digit", hour12: false };
  return date.toLocaleString("en-US", options);
}

exports.listChatUsers = async (req, res) => {
  try {
    console.log(
      `>>>>>>>>>>>>>> list chat users for ${req.user._id}>>>>>>>>>>>>>`
    );
    const data = await Chat.find({ user_id: req.user._id }).sort({
      createdAt: -1,
    });

    let chatUser = [];
    let listUsers = [];
    data.forEach((user) => {
      if (!chatUser.includes(user.to_send)) {
        if (user.to_send !== "null") {
          chatUser.push(user.to_send);
        }
      }
    });

    for (const id of chatUser) {
      console.log("ID ", id);
      const startupData = await UserModel.find({
        _id: mongoose.Types.ObjectId(id),
      });
      const investorData = await investorModel.find({
        _id: mongoose.Types.ObjectId(id),
      });

      if (startupData.length !== 0) {
        console.log(">>>>.. startup >>>>>>>");
        listUsers.push(...startupData);
      }
      if (investorData.length !== 0) {
        console.log(">>>>>>>>>. investor >>>>");
        listUsers.push(...investorData);
      }
    }

    res
      .status(201)
      .json({ status: true, message: "user data fetched", data: listUsers });
  } catch (err) {
    return res.status(401).json({
      status: false,
      message: err.message,
      stack: err.stack,
    });
  }
};

exports.updataMobileNotify = async (req, res) => {
  try {
    console.log(
      `>>>>>>>>>>>>  ${req.user._id}  ${req.body.mobileNotify} >>>>>>>>>>>>>`
    );
    const startupUpdate = await UserModel.findByIdAndUpdate(req.user._id, {
      $set: { mobileNotify: req.body.mobileNotify },
    });
    const investerUpdate = await investorModel.findByIdAndUpdate(req.user._id, {
      $set: { mobileNotify: req.body.mobileNotify },
    });
    if (!startupUpdate && !investerUpdate) {
      return res
        .status(409)
        .json({ message: "Failed to update user", status: false });
    }
    res
      .status(200)
      .json({ message: "User updated successfully", status: true });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: err.message,
      stack: err.stack,
    });
  }
};

exports.countSet = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("userId : ", userId);
    const user1 = await UserModel.findOne({ _id: req.user._id });
    const user2 = await investorModel.findOne({ _id: req.user._id });
    let loginUser;
    user1 ? (loginUser = user1) : (loginUser = user2);
    console.log("loginUser", loginUser);
    if (loginUser.count >= process.env.COUNT_LIMIT) {
      return res.status(429).json({
        status: false,
        message: "You have reached the limit of sending notifications",
      });
    }

    const modifyStartup = await UserModel.findByIdAndUpdate(loginUser._id, {
      $inc: { count: 1 }, // Increment the count field by 1
    });
    const modifyInvestor = await investorModel.findByIdAndUpdate(
      loginUser._id,
      {
        $inc: { count: 1 }, // Increment the count field by 1
      }
    );

    res.status(200).json({ message: "Increase", status: true });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: err.message,
      stack: err.stack,
    });
  }
};
