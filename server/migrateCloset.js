const mongoose = require("mongoose");
const { VirtualClosetModel } = require("./models");

const MODEL_MAP = {
  "1": { S: "/models/Ao_Thun_sizeS.glb", M: "/models/Ao_Thun_sizeM.glb", L: "/models/Ao_Thun_sizeL.glb" },
  "4": { S: "/models/croptopS.glb", M: "/models/croptopM.glb", L: "/models/croptopL.glb" },
  "6": { S: "/models/QuanSuongS.glb", M: "/models/QuanSuongM.glb", L: "/models/QuanSuongL.glb" },
  "8": { S: "/models/QuanS.glb", M: "/models/QuanM.glb", L: "/models/QuanL.glb" },
  "16": { S: "/models/vay1-S.glb", M: "/models/vay1-M.glb", L: "/models/vay1-L.glb" },
  "17": { S: "/models/vay2-S.glb", M: "/models/vay2-M.glb", L: "/models/vay2-L.glb" },
  "18": { S: "/models/vayhoa - S.glb", M: "/models/vayhoa - M.glb", L: "/models/vayhoa - L.glb" },
  "19": { S: "/models/chanvayS.glb", M: "/models/chanvayM.glb", L: "/models/chanvayL.glb" }
};

mongoose.connect("mongodb+srv://tranghuyen20051312_db_user:fZIiwCiaSISzZdbL@vfitai-db.lgiujty.mongodb.net/?appName=VFitAI-DB").then(async () => {
  console.log("Connected to DB. Starting Virtual Closet migration...");
  const closets = await VirtualClosetModel.find();
  let updatedCount = 0;

  for (const closet of closets) {
    let modified = false;
    for (const item of closet.items) {
      if (!item.size && item.purchasedSize) {
        item.size = item.purchasedSize;
        modified = true;
      }
      if (!item.color && item.purchasedColor) {
        item.color = item.purchasedColor;
        modified = true;
      }
      
      const sizeKey = (item.size || "M").toUpperCase();
      const productIdStr = String(item.productId);
      
      if (!item.glbUrl && MODEL_MAP[productIdStr] && MODEL_MAP[productIdStr][sizeKey]) {
        item.glbUrl = MODEL_MAP[productIdStr][sizeKey];
        modified = true;
      }
      
      if (!item.variantId) {
        item.variantId = `var_${sizeKey}_${item.color || 'default'}`.replace(/\s+/g, '_');
        modified = true;
      }
    }
    
    if (modified) {
      // Use markModified if needed, or simply save
      await closet.save();
      updatedCount++;
    }
  }
  
  console.log(`Migration complete! Updated ${updatedCount} closet documents.`);
  process.exit(0);
}).catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
