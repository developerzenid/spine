const cron = require("node-cron");
const Startup = require("../models/userStartupModel");
const Investor = require("../models/userInvestorModel");

//-------------------CONFIGURE CRON JOB TO RESET THE SWIPE COUNT AT MIDNIGHT-------------

exports.cronSchedule = cron.schedule("0 0 * * *", async () => {
  //----------TO TEST CRON JOB SET (* * * * *) RUN EVERY MINUTE-----------
  try {
    console.log("Cron job started");
    const user1 = await Startup.updateMany({}, { $set: { count: 0 } });
    const user2 = await Investor.updateMany({}, { $set: { count: 0 } });
  } catch (error) {
    console.log(error.stack);
  }
});
