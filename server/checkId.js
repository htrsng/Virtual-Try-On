const mongoose = require("mongoose");
const { VirtualClosetModel } = require("./models");

mongoose.connect("mongodb+srv://tranghuyen20051312_db_user:fZIiwCiaSISzZdbL@vfitai-db.lgiujty.mongodb.net/?appName=VFitAI-DB").then(async () => {
  const closets = await VirtualClosetModel.find();
  for (const closet of closets) {
    for (const item of closet.items) {
      console.log(`Name: ${item.name}, productId: ${item.productId}, typeof: ${typeof item.productId}`);
    }
  }
  process.exit(0);
});
