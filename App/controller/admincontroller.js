let bcrypt = require("bcrypt");
let jwt = require("jsonwebtoken");
const SendOtp = require("../middlewares/sendOtp");
let adminModel = require("../models/adminModel");
const Investor = require("../models/userInvestorModel");
const Startup = require("../models/userStartupModel");
const moment = require("moment");

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

exports.manageUsers = async (req, res) => {
  try {
    const startupData = await Startup.aggregate([
      {
        $project: {
          _id: 1,
          profile_pic: 1,
          startupName: 1,
          email: 1,
          role: 1,
          isActive: 1,
          location: 1,
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          description: 1,
          count: 1,
          lastCountReset: 1,
        },
      },
    ]);

    const investorData = await Investor.aggregate([
      {
        $project: {
          _id: 1,
          investorName: 1,
          profile_pic: 1,
          email: 1,
          role: 1,
          isActive: 1,
          location: 1,
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          bio: 1,
          count: 1,
          lastCountReset: 1,
        },
      },
    ]);

    const currentDateTime = moment();
    const swipeResetDuration = moment.duration(24, "hours");

    const swipe = await adminModel.find().select("swipeCount");
    const result = [...startupData, ...investorData];

    result.map((obj) => {
      obj.totalSwipe = swipe[0].swipeCount;
      obj.swipeLeft = swipe[0].swipeCount - obj.count;
      let resetTimeLeft = "0:0 hr";

      if (obj.lastCountReset) {
        const lastCountResetTimestamp = obj.lastCountReset;
        const lastCountResetDate = moment(lastCountResetTimestamp);

        const timeElapsed = moment.duration(
          currentDateTime.diff(lastCountResetDate)
        );
        let timeLeft = swipeResetDuration.subtract(timeElapsed);

        if (timeLeft.asMinutes() < 0) {
          timeLeft = moment.duration(0);
        } else {
          const hours = Math.floor(timeLeft.asHours());
          const minutes = timeLeft.minutes();
          resetTimeLeft = `${hours}:${minutes} hr`;
        }
      }
      obj.timeLeft = resetTimeLeft;
    });

    res.status(201).json({
      status: true,
      message: "User fetched successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      status: "500",
      message: "Something went wrong",
      error: error.stack,
    });
  }
};

exports.singleUser = async (req, res) => {
  try {
    console.log(`>>>>>>>>>>>  ${req.query._id} >>>>>>>>>>.`);
    const startupData = await Startup.findById(req.query._id)
      .select({
        _id: 1,
        profile_pic: 1,
        startupName: 1,
        email: 1,
        role: 1,
        isActive: 1,
        location: 1,
        createdAt: 1,
        description: 1,
        count: 1,
        lastCountReset: 1,
      })
      .lean();

    const investorData = await Investor.findById(req.query._id)
      .select({
        _id: 1,
        profile_pic: 1,
        investorName: 1,
        email: 1,
        role: 1,
        isActive: 1,
        location: 1,
        createdAt: 1,
        bio: 1,
        count: 1,
        lastCountReset: 1,
      })
      .lean();
    const swipe = await adminModel.find().select("swipeCount");

    let result = startupData ? startupData : investorData;

    result.date = result.createdAt.toISOString().split("T")[0];

    const currentDateTime = moment();
    const swipeResetDuration = moment.duration(24, "hours");

    result.totalSwipe = swipe[0].swipeCount;
    result.swipeLeft = swipe[0].swipeCount - result.count;
    let resetTimeLeft = "0:0 hr";

    if (result.lastCountReset) {
      const lastCountResetTimestamp = result.lastCountReset;
      const lastCountResetDate = moment(lastCountResetTimestamp);

      const timeElapsed = moment.duration(
        currentDateTime.diff(lastCountResetDate)
      );
      let timeLeft = swipeResetDuration.subtract(timeElapsed);

      if (timeLeft.asMinutes() < 0) {
        timeLeft = moment.duration(0);
      } else {
        const hours = Math.floor(timeLeft.asHours());
        const minutes = timeLeft.minutes();
        resetTimeLeft = `${hours}:${minutes} hr`;
      }
    }
    result.timeLeft = resetTimeLeft;

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
      error: error.stack,
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
    const { name, email, swipeCount } = req.body;
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
          swipeCount: swipeCount,
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

exports.changeAdminPassword = async (req, res, next) => {
  try {
    const { oldpassword, newpassword, confirmpassword } = req.body;
    console.log(req.body);
    if (oldpassword && newpassword && confirmpassword) {
      const { password } = await adminModel.findById({ _id: req.user._id });
      if (newpassword != confirmpassword) {
        throw new Error("Newpassword & confirm do not match");
      } else {
        const checkPassword = await bcrypt.compare(oldpassword, password);
        if (checkPassword == false) {
          throw new Error("Please Check your old password");
        }
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(newpassword, salt);
        const updatepassword = await adminModel.findByIdAndUpdate(
          { _id: req.user._id },
          {
            $set: { password: hashPassword },
          },
          { new: true }
        );
        return res.status(200).json({
          status: true,
          message: "Password change successfully",
        });
      }
    } else {
      throw new Error("All filed required");
    }
  } catch (err) {
    return res.status(401).json({
      status: false,
      message: err.message,
      stack: err.stack,
    });
  }
};
