const mongoose = require("mongoose");
const { VirtualClosetModel } = require("./models");

mongoose.connect("mongodb+srv://tranghuyen20051312_db_user:fZIiwCiaSISzZdbL@vfitai-db.lgiujty.mongodb.net/?appName=VFitAI-DB").then(async () => {
  console.log("Connected to DB, fixing closets...");
  const closets = await VirtualClosetModel.find();
  let count = 0;
  for (const closet of closets) {
    let modified = false;
    for (const item of closet.items) {
      if (!item.purchasedSize || !item.purchasedColor) {
        item.purchasedSize = item.purchasedSize || "M";
        item.purchasedColor = item.purchasedColor || "#222222";
        modified = true;
      }
    }
    if (modified) {
      await closet.save();
      count++;
    }
  }
  console.log(`Fixed ${count} closets.`);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
