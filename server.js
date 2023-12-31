"use strict";
let express = require("express");
let bodyParser = require("body-parser");
let cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const socket = require("socket.io");
const User = require("./App/models/userStartupModel");
const Investor = require("./App/models/userInvestorModel");
const Chat = require("./App/models/socketmessage");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.get("/", (req, res) => {
  res.send("Hey there");
});

// JSON
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
//config..................................................................................
require("./App/config/config.js");
//Router...................................................................................
require("./App/routes/userStartupRoutes.js")(app);
require("./App/routes/roleRouter.js")(app);
require("./App/routes/investorRouter.js")(app);
require("./App/routes/startUpMessages.js")(app);
require("./App/routes/investerMessageRouter.js")(app);
const admin = require("./App/routes/adminRouter.js");
const investorProfile = require("./App/routes/investorprofileRouter.js");
const startupProfile = require("./App/routes/startupprofileRouter.js");
require("./App/services/cronjob").cronSchedule;

app.use(investorProfile);
app.use(startupProfile);
app.use(admin);
// CORS Policy
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

//data
const crypto = require("crypto");
//Installed Modules
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var burl = "https://api.binance.com";
var endPoint = "/api/v3/order";
var dataQueryString =
  "symbol=BTCUSDT&side=BUY&type=LIMIT&timeInForce=GTC&quantity=0.003&price=6200&recvWindow=20000&timestamp=" +
  Date.now();
var keys = {
  akey: "cyO2du3EwtFVKa9aBnBT4p5yQOQTUYr9NDIBcSZXRpWi860VtGUJ8KbveeFOiHWh",
  skey: "w1rpojM21jaGRKOmr98wZFbwEcGgibtOImLnKfIvjT3AP0Li2N9SCjl6Yc4H5PJz",
};
var signature = crypto
  .createHmac("sha256", keys["skey"])
  .update(dataQueryString)
  .digest("hex");
var url = burl + endPoint + "?" + dataQueryString + "&signature=" + signature;
var ourRequest = new XMLHttpRequest();
ourRequest.open("POST", url, true);
ourRequest.setRequestHeader("X-MBX-APIKEY", keys["akey"]);

ourRequest.onload = function () {
  console.log(ourRequest.responseText);
};
ourRequest.send();

const server = app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

const io = socket(server, {
  cors: {
    // origin: "http://localhost:8000",
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// const onlineUsers = {};

// io.on("connection", (socket) => {
//   console.log("Connect socket.io");
//   console.log("Socket ID:", socket.id);

//   socket.on("add-user", async (userId) => {
//     console.log(`>>>>>>>>>>> ${userId} added >>>>>>>>>>`);

//     onlineUsers[userId] = socket.id;
//     await User.findByIdAndUpdate({ _id: userId }, { $set: { isActive: true } });
//     await Investor.findByIdAndUpdate(
//       { _id: userId },
//       { $set: { isActive: true } }
//     );

//     socket.emit("onlineuser", { userid: userId });
//   });

//   socket.on("send-msg", async function (data) {
//     console.log(data);

//     console.log(`>>>>>>>>>>>>1  ${data} >>>>>>>>>>> `);
//     if (onlineUsers[data.to]) {
//       const sendId = onlineUsers[data.to];
//       const userId = onlineUsers[data.from]
//       console.log(`>>>>>>>> send id ${sendId} >>>>>>>>>`);
//       console.log(`>>>>>>>>>>>>2 ${data} received >>>>>>>>>>>>`);
//       console.log(`>>>>>>>>>>>>3 ${data.message} >>>>>>>>>>>>`);

//       socket.to(sendId).to(userId).emit("receivedMsg", data.message);

//       const check = await Chat.create({
//         user_id: data.from,
//         to_send: data.to,
//         message: data.message,
//       });
//       console.log(`>>>>>>>>>>4  ${check} >>>>>>>>>>>`);
//     }
//   });

//   socket.on("disconnect", async (userId) => {
//     console.log(`>>>>>>>>>>> ${userId} Disconnected >>>>>>>>>>>>`);
//     await User.findByIdAndUpdate(
//       { _id: userId },
//       { $set: { isActive: false } }
//     );
//     await Investor.findByIdAndUpdate(
//       { _id: userId },
//       { $set: { isActive: false } }
//     );
//     socket.emit("Offlineuser", { userid: userId });
//   });
// });

const onlineUsers = {};
const offlineMessages = {};

io.on("connection", (socket) => {
  console.log("Connected socket.io");
  console.log("Socket ID:", socket.id);

  socket.on("add-user", (userId) => {
    console.log(`User ${userId} added to online users`);
    onlineUsers[userId] = socket.id;

    if (offlineMessages[userId]) {
      offlineMessages[userId].forEach((message) => {
        socket.emit("receivedMsg", message);
      });
      delete offlineMessages[userId];
    }

    Promise.all([
      User.findByIdAndUpdate(userId, { $set: { isActive: true } }),
      Investor.findByIdAndUpdate(userId, { $set: { isActive: true } }),
    ])
      .then(() => {
        socket.broadcast.emit("onlineuser", { userid: userId });
      })
      .catch((error) => {
        console.error("Error updating user status:", error);
      });
  });

  socket.on("send-msg", async (data) => {
    console.log("Message data:", data);

    if (onlineUsers[data.to]) {
      const sendId = onlineUsers[data.to];
      const userId = onlineUsers[data.from];
      console.log(`Sending message to ${data.to} from ${data.from}`);

      io.to(sendId).to(userId).emit("receivedMsg", data.message);

      // Create a chat record
    } else {
      if (!offlineMessages[data.to]) {
        offlineMessages[data.to] = [];
      }
      io.to(data.from).emit("receivedMsg", data.message);
      offlineMessages[data.to].push(data.message);

      console.log(
        `User ${data.to} is offline. Message is stored for later delivery.`
      );
    }
    try {
      const chat = await Chat.create({
        user_id: data.from,
        to_send: data.to,
        message: data.message,
        time: data.time,
      });
      console.log("Chat record created:", chat);
    } catch (error) {
      console.error("Error creating chat record:", error);
    }
  });

  socket.on("disconnect", () => {
    // Find the disconnected user based on socket.id
    const disconnectedUserId = Object.keys(onlineUsers).find(
      (userId) => onlineUsers[userId] === socket.id
    );

    if (disconnectedUserId) {
      console.log(`User ${disconnectedUserId} Disconnected`);

      // Update user's isActive status using promises
      Promise.all([
        User.findByIdAndUpdate(disconnectedUserId, {
          $set: { isActive: false },
        }),
        Investor.findByIdAndUpdate(disconnectedUserId, {
          $set: { isActive: false },
        }),
      ])
        .then(() => {
          socket.emit("Offlineuser", { userid: disconnectedUserId });
          delete onlineUsers[disconnectedUserId];
        })
        .catch((error) => {
          console.error("Error updating user status:", error);
        });
    }
  });
});
