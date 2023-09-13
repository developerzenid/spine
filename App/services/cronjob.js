const cron = require("node-cron");
const Startup = require("../models/userStartupModel");
const Investor = require("../models/userInvestorModel");

//-------------------CONFIGURE CRON JOB TO RESET THE SWIPE COUNT AT MIDNIGHT-------------

// Create a cron job to run every minute
exports.cronSchedule = cron.schedule("0 * * * *", async () => {
  //----------TO TEST CRON JOB SET (* * * * *) RUN EVERY MINUTE-----------
  try {
    console.log("Cron job started");
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Find users whose counts are at the limit and last reset was more than 24 hours ago
    const usersToUpdate = await Startup.find({
      count: 10,
      lastCountReset: { $lt: twentyFourHoursAgo },
    });
    const usersToUpdate2 = await Investor.find({
      count: 10,
      lastCountReset: { $lt: twentyFourHoursAgo },
    });

    const finalResult = [...usersToUpdate, ...usersToUpdate2];

    //counts and update the lastCountReset timestamp
    for (const user of finalResult) {
      user.count = 0;
      user.lastCountReset = new Date();
      await user.save();
    }

    console.log("Cron job completed");
  } catch (error) {
    console.log(error.stack);
  }
});
