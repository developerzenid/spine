let bcrypt = require("bcrypt");
let jwt = require("jsonwebtoken");
const SendOtp = require("../middlewares/sendOtp");
let adminModel = require("../models/adminModel");
const Investor = require("../models/userInvestorModel");
const Startup = require("../models/userStartupModel");

exports.adminSignUp = async (req, res, next) => {
  try {
    const data = req.body;
    console.log("admin signup=============", data);
    if (!data.email || !data.password) {
      return res.status(400).json({
        status: false,
        message: "required email and password",
      });
    } else {
      const admin = await adminModel.findOne({ email: data.email });
      if (admin) {
        throw new Error("your email already exist");
      }
      let hashedPass = await bcrypt.hashSync(data.password, 10);
      data.password = hashedPass;

      let addAdmin = await new adminModel(data).save();
      console.log("my admin is================", addAdmin._id);
      if (addAdmin) {
        const token = jwt.sign(
          { userID: addAdmin._id },
          process.env.JWT_SECRET_KEY,
          {
            expiresIn: "5d",
          }
        );
        console.log("my token is==============", token);
        data.token = token;
        let criteria = { _id: addAdmin._id };
        var newvalues = {
          $set: {
            token: token,
          },
        };
        let options = { new: true };

        const adminSign = await adminModel.findOneAndUpdate(
          criteria,
          newvalues,
          options
        );
        if (adminSign) {
          return res.status(200).json({
            status: true,
            message: "Admin signed-in  successfully",
            response: adminSign,
          });
        } else {
          return res.status(401).json({
            status: false,
            message: "unable to update updsate admin sign-in token",
          });
        }
      }
    }
  } catch (err) {
    return res.status(401).json({
      status: false,
      message: err.message,
      stack: err.stack,
    });
  }
};

exports.getAdmin = async (req, res) => {
  try {
    console.log(`>>>>>>>>>>> Get Admin ${req.body} >>>>>>>>>`);
    const data = await adminModel.find(req.user._id);
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
    return res.status(401).json({
      status: false,
      message: err.message,
      stack: err.stack,
    });
  }
};

exports.adminLogin = async (req, res, next) => {
  try {
    let data = req.body;
    console.log("my data is==========", data);
    let check_admin = await adminModel.findOne({ email: data.email });
    console.log("my database data is===========", check_admin);
    if (!check_admin) {
      return res.status(401).json({
        status: false,
      });
    } else {
      let adminPassword = await bcrypt.compare(
        data.password,
        check_admin.password
      );
      console.log("my logged password===========", adminPassword);
      if (adminPassword == true) {
        const token = jwt.sign(
          { userID: check_admin._id },
          process.env.JWT_SECRET_KEY,
          {
            expiresIn: "5d",
          }
        );
        data.token = token;
        let criteria = { _id: check_admin._id };
        var newvalues = {
          $set: {
            token: token,
          },
        };
        let options = { new: true };
        const adminSign = await adminModel.findOneAndUpdate(
          criteria,
          newvalues,
          options
        );
        if (adminSign) {
          return res.status(200).json({
            status: true,
            message: "Admin signed-in  successfully",
            response: adminSign,
          });
        }
      } else {
        return res.status(401).json({
          status: false,
          message: "password is not matched",
        });
      }
    }
  } catch (err) {
    return res.status(401).json({
      status: false,
      message: err.message,
      stack: err.stack,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    console.log(
      `>>>>>>>>>>> Reset Password for mail ${req.body.email} >>>>>>>>>`
    );
    const check = await adminModel.findOne({ email: req.body.email });
    if (!check) {
      return res.status(404).json({
        status: false,
        message: `User not found with email: ${req.body.email}`,
      });
    }
    f;

    const otp = Math.floor(1000 + Math.random() * 9000);

    await SendOtp(req.body.email, otp, check.name);
    await adminModel.updateOne(
      { email: req.body.email },
      {
        $set: {
          otp: otp,
        },
      }
    );
    res.status(200).json({
      status: true,
      message: `Mail send successfully`,
    });
  } catch (err) {
    return res.status(401).json({
      status: false,
      message: err.message,
      stack: err.stack,
    });
  }
};

exports.resendOtp = async (req, res, next) => {
  try {
    console.log(req.body);
    const { email } = req.body;
    const otp = Math.floor(1000 + Math.random() * 9000);
    const setemail = await adminModel.findOneAndUpdate(
      { email: email },
      {
        $set: {
          otp: otp,
        },
      },
      { new: true }
    );
    SendOtp(email, otp, setemail.name);
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

exports.verifyotp = async (req, res) => {
  try {
    console.log(req.body);
    const { email, otp } = req.body;
    const checkemail = await adminModel.findOne({ email: email });
    console.log("checkemail", checkemail);
    console.log("otp", otp);
    if (checkemail.otp != otp) {
      return res.status(401).json({
        status: false,
        message: "Otp doesn't match",
      });
    } else {
      await adminModel.updateOne(
        { email: email },
        {
          $set: { otp_verified: true },
        },
        { new: true }
      );
      const checkotp = await adminModel.findOne({ email: email });
      return res.status(200).json({
        status: true,
        message: "Otp verified successfully",
        response: checkotp,
      });
    }
  } catch (err) {
    return res.status(401).json({
      status: false,
      message: err.message,
    });
  }
};

exports.setPassword = async (req, res) => {
  const { password, password_confirmation, email } = req.body;
  console.log(req.body);
  try {
    const checkotpVerify = await adminModel.findOne({ email: email });
    console.log(checkotpVerify?.otp_verified == true);
    if (checkotpVerify?.otp_verified) {
      console.log(">>>>>> true >>>>>>>>>");
      const salt = await bcrypt.genSalt(10);
      const newHashPassword = await bcrypt.hash(password, salt);
      if (password === password_confirmation) {
        const saved_user = await adminModel.findOneAndUpdate(
          { email: email },
          { $set: { password: newHashPassword } }
        );
        const otp_verified = await adminModel.findOneAndUpdate(
          { email: email },
          { $set: { otp_verified: false } }
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
    } else {
      res.status(401).send({
        success: false,
        status: "401",
        message: "Please resend otp again",
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

exports.manageUsers = async (req, res) => {
  try {
    console.log(`>>>>>>>>>> inside user manager api >>>>>>>>`);
    const startupData = await Startup.find();
    const investorData = await Investor.find();
    const final = [...startupData, ...investorData];
    res
      .status(201)
      .json({
        status: true,
        message: "user fetched successfully",
        data: final,
      });
  } catch (error) {
    return res.status(500).send({
      success: false,
      status: "500",
      message: "Something Went Wrongs",
    });
  }
};

exports.singleUser = async (req, res) => {
  try {
    console.log(`>>>>>>>>>>>  ${req.query._id} >>>>>>>>>>.`);
    const startupData = await Startup.findById(req.query._id);
    const investorData = await Investor.findById(req.query._id);
    let result;
    if (startupData) {
      result = startupData;
    }
    if (investorData) {
      result = investorData;
    }
    res.status(201).json({
      status: true,
      message: "user data",
      data: result,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      status: "500",
      message: "Something Went Wrongs",
    });
  }
};
exports.deleteUser = async (req, res) => {
  try {
    console.log(`${req.query._id}`);
    if (!req.query._id) {
      return res.status(404).json({ status: false, message: "id is missing" });
    }
    const startupData = await Startup.findByIdAndDelete(req.query._id);
    const investorData = await Investor.findByIdAndDelete(req.query._id);
    if (startupData || investorData) {
      res
        .status(201)
        .json({ status: true, message: `user deleted successfully` });
    }
  } catch (error) {
    return res.status(500).send({
      success: false,
      status: "500",
      message: "Something Went Wrongs",
    });
  }
};

exports.updateAdminProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userData = await adminModel.findOne({ _id: req.user._id });
    let profilePic; // Default profile picture
    console.log("object", req.file);
    if (req.file) {
      profilePic = req.file.location;
    } else {
      profilePic = userData.profilePic;
    }
    console.log("profilePic", profilePic);
    await adminModel.findByIdAndUpdate(
      { _id: req.user._id },
      {
        $set: {
          name: name ? name : userData.name,
          email: email ? email : userData.email,
          profilePic: profilePic,
        },
      }
    );

    const fetchdata = await adminModel.findOne({ _id: req.user._id });

    return res.status(200).json({
      status: true,
      message: "Profile Updated Successfully",
      response: fetchdata,
    });
  } catch (err) {
    return res.status(401).json({
      status: false,
      message: err.message,
    });
  }
};
