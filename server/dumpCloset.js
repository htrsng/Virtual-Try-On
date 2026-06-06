const mongoose = require("mongoose");
const { VirtualClosetModel } = require("./models");

mongoose.connect("mongodb+srv://tranghuyen20051312_db_user:fZIiwCiaSISzZdbL@vfitai-db.lgiujty.mongodb.net/?appName=VFitAI-DB").then(async () => {
  const closets = await VirtualClosetModel.find();
  for (const closet of closets) {
    for (const item of closet.items) {
      if (item.productId === 1 || item.productId === "1") {
        console.log(`Áo Thun: glbUrl=${item.glbUrl}, size=${item.size}, color=${item.color}`);
        console.log(`item keys: ${Object.keys(item.toObject ? item.toObject() : item)}`);
      }
    }
  }
  process.exit(0);
});
