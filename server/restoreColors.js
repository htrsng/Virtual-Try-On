const mongoose = require("mongoose");
const { VirtualClosetModel, OrderModel } = require("./models");

mongoose.connect("mongodb+srv://tranghuyen20051312_db_user:fZIiwCiaSISzZdbL@vfitai-db.lgiujty.mongodb.net/?appName=VFitAI-DB").then(async () => {
  const closets = await VirtualClosetModel.find();
  for (const closet of closets) {
    let modified = false;
    for (const item of closet.items) {
      if (item.orderId) {
        const order = await OrderModel.findById(item.orderId);
        if (order) {
          const productInOrder = order.products.find(p => String(p.productId || p._id) === String(item.productId));
          if (productInOrder) {
            const originalColor = String(productInOrder.color || productInOrder.selectedColor || productInOrder.variant?.color || "").trim();
            if (originalColor && originalColor !== item.color) {
              console.log(`Restoring color for ${item.name}: ${item.color} -> ${originalColor}`);
              item.color = originalColor;
              // Attempt to resolve colorLabel
              if (originalColor.includes('Đen') || originalColor === '#222222') item.colorLabel = 'Đen';
              else if (originalColor.includes('Trắng') || originalColor === '#f5f5f5') item.colorLabel = 'Trắng';
              else if (originalColor.includes('Xám')) item.colorLabel = 'Xám';
              else if (originalColor.includes('Kaki') || originalColor === '#d4c3a3') item.colorLabel = 'Kaki';
              
              // If originalColor is a hex, we might need to find the label, or if it's a label, we keep it as color.
              // Actually, the new schema uses color as Hex and colorLabel as Name.
              // If the original order saved 'Trắng' in color, we should map it to #f5f5f5 in color, and 'Trắng' in colorLabel.
              if (originalColor === 'Trắng') { item.color = '#f5f5f5'; item.colorLabel = 'Trắng'; }
              else if (originalColor === 'Đen') { item.color = '#222222'; item.colorLabel = 'Đen'; }
              else if (originalColor === 'Xám') { item.color = '#47484c'; item.colorLabel = 'Xám'; }
              else if (originalColor === 'Kaki') { item.color = '#d4c3a3'; item.colorLabel = 'Kaki'; }
              
              item.variantId = `var_${item.size}_${item.colorLabel || item.color}`.replace(/\s+/g, '_');
              modified = true;
            }
          }
        }
      }
    }
    if (modified) {
      await closet.save();
    }
  }
  console.log("Color restore complete.");
  process.exit(0);
});
