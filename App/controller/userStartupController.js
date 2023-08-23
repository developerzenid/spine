let UserModel = require("../models/userStartupModel.js");
let investorModel = require("../models/userInvestorModel.js");
let NotificationModel = require("../models/notificationModel.js");
let statUpAcceptModel = require("../models/startUpRequestAcceptModel.js");
let investorNotificationModel = require("../models/investorNotificationModel.js");
let bcrypt = require("bcrypt");
let jwt = require("jsonwebtoken");
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
      ticketSize,
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
    console.log("user", user_id);

    // Find notifications sent by user_id
    // const sentNotifications = await notification.find({ user_id: user_id });
    const sentNotifications = await investorNotificationModel.find({
      user_id: user_id,
    });
    console.log("sent", sentNotifications);

    // Extract the recipient user IDs from sentNotifications
    const recipientIds = sentNotifications.map(
      (notification) => notification.to_send
    );
    console.log("rec", recipientIds);

    // Find users whose IDs are not present in the recipientIds array
    const usersNotInNotification = await investorModel.aggregate([
      { $match: { _id: { $nin: recipientIds } } },
      // { $match: { otp_verified: true } },
      { $sample: { size: 100000000 } },
    ]);
    console.log("Users that doesn't exist in list", usersNotInNotification);

    // let newUsersNotInNotification = this.filterDataByMyId(
    //   user_id,
    //   usersNotInNotification
    // );
    // console.log("newUserNoti", newUsersNotInNotification);

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
    const fetchProfile = await UserModel.aggregate([{ $match: match }]);

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
    const fetchProfile = await investorModel.find();
    // const fetchProfile = await investorModel.aggregate([{ $sample: { } }]);

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

    // console.log("loginUserloginUserloginUser", loginUser);
    // console.log("UserUserUserUser", User);

    const Notificationcreate = await investorNotificationModel.create({
      user_id: req.user._id,
      to_send: user_id,
      title: `${loginUser.startupName} is intersted in connecting with you`,
    });

    if (!loginUser?.intrestedIn) loginUser.intrestedIn = [];
    loginUser.intrestedIn.push(user_id);
    console.log("User.intrestedIn", loginUser.intrestedIn, User);

    const updateThisUserForIntrestedInUser = await UserModel.findByIdAndUpdate(
      req.user._id,
      { $set: { intrestedIn: [...loginUser.intrestedIn] } }
    );
    console.log(
      "updateThisUserForIntrestedInUser",
      updateThisUserForIntrestedInUser
    );

    console.log("User.mobile_token", User.mobile_token);
    var message = {
      to: User.mobile_token,
      notification: {
        title: "notification",
        body: `is intersted in connecting with you`,
      },
    };

    console.log("fcm", fcm);
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

//*****************************************************************************************************************************/
//fetch notification
//****************************************************************************************************************************/

module.exports.fetchNotification = async (req, res, next) => {
  try {
    const user_id = req.user._id;
    const fetchNotification = await notification
      .find({ to_send: user_id })
      .populate("user_id");
    if (fetchNotification && fetchNotification.length > 0) {
      return res.status(200).json({
        status: true,
        message: "Notification sent successfully",
        response: fetchNotification,
      });
    } else {
      return res.status(200).json({
        status: false,
        message: "Notification is not available",
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
//accept request
//****************************************************************************************************************************/

module.exports.acceptRequest = async (req, res, next) => {
  try {
    const { user_id, _id } = req.body;
    const User = await investorModel.findOne({ _id: user_id });
    console.log("User", User);
    console.log("User toklen", User.mobile_token);
    const loginUser = await UserModel.findOne({ _id: req.user._id });
    const Notificationcreate = await investorNotificationModel.create({
      user_id: req.user._id,
      title: `${loginUser.startupName} started following you`,
      status: "accept",
    });
    // const startUpRequestAccept=await statUpAcceptModel.create({
    //   from:req.user._id ,
    //   to:user_id
    // })
    const startUpRequestAccept = await notification.findByIdAndUpdate(
      { _id: _id },
      { $set: { status: "accept", title: "Started following you" } }
    );
    var message = {
      to: User.mobile_token,
      notification: {
        title: "notification",
        body: `${loginUser.startupName} started following you`,
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
