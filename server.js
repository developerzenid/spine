"use strict";
let express =require('express')
let  bodyParser = require('body-parser');
let cors =require('cors');
const dotenv = require('dotenv');
dotenv.config();
const socket = require("socket.io");

const app = express()
const port = process.env.PORT ||3000

// JSON
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
//config..................................................................................
require('./App/config/config.js')
//Router...................................................................................
require('./App/routes/userStartupRoutes.js')(app)
require('./App/routes/roleRouter.js')(app)
require('./App/routes/investorRouter.js')(app)
require('./App/routes/startUpMessages.js')(app)
require('./App/routes/investerMessageRouter.js')(app)


// CORS Policy
app.use(cors());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header("Access-Control-Allow-Headers", "x-access-token, Origin, X-Requested-With, Content-Type, Accept");
  next();
});

//data
const crypto = require('crypto');
//Installed Modules
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var burl = "https://api.binance.com";
var endPoint = "/api/v3/order";
var dataQueryString = "symbol=BTCUSDT&side=BUY&type=LIMIT&timeInForce=GTC&quantity=0.003&price=6200&recvWindow=20000&timestamp=" + Date.now();
var keys = {
    "akey" : 'cyO2du3EwtFVKa9aBnBT4p5yQOQTUYr9NDIBcSZXRpWi860VtGUJ8KbveeFOiHWh',
    "skey" : 'w1rpojM21jaGRKOmr98wZFbwEcGgibtOImLnKfIvjT3AP0Li2N9SCjl6Yc4H5PJz',
}
var signature = crypto.createHmac('sha256',keys['skey']).update(dataQueryString).digest('hex');
var url = burl + endPoint + '?' + dataQueryString + '&signature=' + signature;
var ourRequest = new XMLHttpRequest();
ourRequest.open('POST',url,true);
ourRequest.setRequestHeader('X-MBX-APIKEY', keys['akey']);

ourRequest.onload = function(){
    console.log(ourRequest.responseText);
}
ourRequest.send();



const server = app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`)
  })

const io = socket(server, {
    cors: {
      // origin: "http://localhost:8000",
      origin:"*",
      methods:["GET","POST"],
      credentials: true,
    },
  });
  
  global.onlineUsers = new Map();
  io.on("connection", (socket) => {
    console.log("Connect socket.io")
    console.log("Socket ID:", socket.id);
    global.chatSocket = socket;
    socket.on("add-user", (userId) => {
      onlineUsers.set(userId, socket.id);
    });
    
    socket.on("send-msg", (data) => {
      const sendUserSocket = onlineUsers.get(data.to);
      if (sendUserSocket) {
        console.log("data",data)
        console.log("data.message",data.message)
        socket.to(sendUserSocket).emit("msg-recieve", data.message);
      }
    });
  });