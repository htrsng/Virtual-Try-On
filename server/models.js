const mongoose = require("mongoose");

const calculateTotalStock = (variants = [], fallbackStock = 0) => {
  if (!Array.isArray(variants) || variants.length === 0) {
    const numericFallback = Number(fallbackStock);
    return Number.isFinite(numericFallback) ? numericFallback : 0;
  }

  return variants.reduce((total, variant) => {
    const sizeStock = Array.isArray(variant?.sizes)
      ? variant.sizes.reduce((sizeTotal, size) => sizeTotal + (Number(size?.stock) || 0), 0)
      : 0;
    return total + sizeStock;
  }, 0);
};

const normalizeProductInventory = (body = {}) => {
  const variants = Array.isArray(body.variants)
    ? body.variants.map((variant) => ({
      color: {
        name: variant?.color?.name || variant?.name || variant?.color || "Mặc định",
        hex: variant?.color?.hex || variant?.hex || "#ffffff",
        image: variant?.color?.image || variant?.image || variant?.img || "",
      },
      sizes: Array.isArray(variant?.sizes)
        ? variant.sizes.map((size) => ({
          size: size?.size || size?.label || "M",
          stock: Number(size?.stock) || 0,
          sku: size?.sku || "",
        }))
        : [],
    }))
    : [];

  const fallbackStock = Number(body.totalStock ?? body.stock) || 0;
  const totalStock = calculateTotalStock(variants, fallbackStock);

  return {
    variants,
    totalStock,
    stock: totalStock,
  };
};

const ProductSchema = new mongoose.Schema({
  id: Number,
  name: String,
  description: String,
  price: Number,
  originalPrice: Number,
  img: String,
  images: { type: [String], default: [] },
  category: String,
  sold: Number,
  rating: Number,
  status: { type: String, default: "active" },
  stock: { type: Number, default: 0 },
  totalStock: { type: Number, default: 0 },
  variants: {
    type: [
      {
        color: {
          name: { type: String, default: "Mặc định" },
          hex: { type: String, default: "#ffffff" },
          image: { type: String, default: "" },
        },
        sizes: [
          {
            size: { type: String, default: "M" },
            stock: { type: Number, default: 0 },
            sku: { type: String, default: "" },
          },
        ],
      },
    ],
    default: [],
  },
  model3D: mongoose.Schema.Types.Mixed,
  ai_attributes: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
});

ProductSchema.pre("save", function () {
  const inventory = normalizeProductInventory(this.toObject ? this.toObject() : this);
  this.variants = inventory.variants;
  this.totalStock = inventory.totalStock;
  this.stock = inventory.stock;
});

const ProductModel = mongoose.model("products", ProductSchema);

const UserSchema = new mongoose.Schema({
  id: Number,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" },
  fullName: { type: String, default: "" },
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  city: { type: String, default: "" },
  district: { type: String, default: "" },
  ward: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});
const UserModel = mongoose.model("users", UserSchema);

const OrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  products: [
    {
      productId: { type: mongoose.Schema.Types.Mixed },
      name: String,
      price: Number,
      quantity: Number,
      img: String,
      color: String,
      size: String,
      selectedColor: String,
      selectedSize: String,
      variant: mongoose.Schema.Types.Mixed,
      model3D: mongoose.Schema.Types.Mixed,
    },
  ],
  totalAmount: { type: Number, required: true },
  discountCode: { type: String, default: "" },
  discountAmount: { type: Number, default: 0 },
  voucherCode: { type: String, default: "" },
  voucherDiscount: { type: Number, default: 0 },
  shippingFee: { type: Number, default: 0 },
  shippingMethod: { type: String, default: "Tiêu chuẩn" },
  shippingInfo: {
    fullName: String,
    phone: String,
    address: String,
    city: String,
    district: String,
    ward: String,
  },
  paymentMethod: { type: String, default: "COD" },
  status: { type: String, default: "Đang xử lý" },
  createdAt: { type: Date, default: Date.now },
  cancelledAt: { type: Date },
  cancelReason: { type: String },
});
const OrderModel = mongoose.model("orders", OrderSchema);

const WishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  products: [
    {
      productId: { type: mongoose.Schema.Types.Mixed },
      name: String,
      price: Number,
      img: String,
      category: String,
      addedAt: { type: Date, default: Date.now },
    },
  ],
  updatedAt: { type: Date, default: Date.now },
});
WishlistSchema.index({ userId: 1 }, { unique: true });
const WishlistModel = mongoose.model("wishlists", WishlistSchema);

const ReviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.Mixed, required: true },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  userName: { type: String, default: "Ẩn danh" },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: "" },
  images: [String],
  likes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});
ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true });
const ReviewModel = mongoose.model("reviews", ReviewSchema);

const ChatMessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  sender: { type: String, enum: ["user", "bot", "admin"], default: "user" },
  message: { type: String, required: true },
  type: { type: String, enum: ["text", "image", "product"], default: "text" },
  metadata: { type: mongoose.Schema.Types.Mixed },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
const ChatMessageModel = mongoose.model("chat_messages", ChatMessageSchema);

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ["order", "promo", "system", "cart_reminder"],
    default: "system",
  },
  link: { type: String, default: "" },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
const NotificationModel = mongoose.model("notifications", NotificationSchema);

const ViewHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  productId: { type: mongoose.Schema.Types.Mixed, required: true },
  category: { type: String },
  viewCount: { type: Number, default: 1 },
  lastViewedAt: { type: Date, default: Date.now },
});
ViewHistorySchema.index({ userId: 1, productId: 1 }, { unique: true });
const ViewHistoryModel = mongoose.model("view_histories", ViewHistorySchema);

const NewsletterSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  couponCode: { type: String, required: true },
  isUsed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
const NewsletterModel = mongoose.model("newsletters", NewsletterSchema);

const UsedCouponSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  couponCode: { type: String, required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "orders" },
  usedAt: { type: Date, default: Date.now },
});
UsedCouponSchema.index({ userId: 1, couponCode: 1 }, { unique: true });
const UsedCouponModel = mongoose.model("usedcoupons", UsedCouponSchema);

const BannerContentSchema = new mongoose.Schema({
  bannerId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  imageUrl: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const BannerContentModel = mongoose.model("banner_contents", BannerContentSchema);

const VirtualClosetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
    unique: true,
  },
  items: [
    {
      itemId: { type: String, required: true },
      orderId: { type: mongoose.Schema.Types.ObjectId, ref: "orders" },
      productId: { type: mongoose.Schema.Types.Mixed, required: true },
      name: { type: String, required: true },
      category: { type: String, required: true },
      price: { type: Number },
      img: { type: String },
      imageUrl: { type: String },
      thumbnailUrl: { type: String },
      material: {
        preset: {
          type: String,
          enum: ["cotton", "denim", "knit", "linen", "satin", "wool", "silk"],
        },
        textures: {
          color: String,
          normal: String,
          roughness: String,
          metallic: String,
          aoMap: String,
        },
        roughnessBias: { type: Number, default: 0.5 },
        metallicFactor: { type: Number, default: 0 },
        aoIntensity: { type: Number, default: 1 },
      },
      model3D: {
        modelUrl: String,
        enabled: { type: Boolean, default: false },
        scale: { type: Number, default: 1 },
        position: { x: Number, y: Number, z: Number },
      },
      dateAdded: { type: Date, default: Date.now },
      lastWorn: { type: Date },
      lastWornAt: { type: Date },
      wearCount: { type: Number, default: 0 },
      wornCount: { type: Number, default: 0 },
      source: { type: String, enum: ["order", "import"], default: "order" },
      isActive: { type: Boolean, default: true },
    },
  ],
  totalItems: { type: Number, default: 0 },
  lastSyncedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
VirtualClosetSchema.index({ userId: 1 });
const VirtualClosetModel = mongoose.model("virtual_closets", VirtualClosetSchema);

const SavedOutfitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  name: { type: String, default: "Outfit chưa đặt tên" },
  slots: {
    tops: { itemId: String, name: String, thumbnailUrl: String },
    bottoms: { itemId: String, name: String, thumbnailUrl: String },
    outerwear: { itemId: String, name: String, thumbnailUrl: String },
    dresses: { itemId: String, name: String, thumbnailUrl: String },
  },
  createdAt: { type: Date, default: Date.now },
});
SavedOutfitSchema.index({ userId: 1, createdAt: -1 });
const SavedOutfitModel = mongoose.models.SavedOutfit
  || mongoose.model("SavedOutfit", SavedOutfitSchema, "saved_outfits");

const AILogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  userPrompt: { type: String, default: "" },
  outfitCount: { type: Number, default: 0 },
  missingCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});
const AILog = mongoose.models.AILog || mongoose.model("AILog", AILogSchema, "ai_logs");

module.exports = {
  ProductModel,
  UserModel,
  OrderModel,
  WishlistModel,
  ReviewModel,
  ChatMessageModel,
  NotificationModel,
  ViewHistoryModel,
  NewsletterModel,
  UsedCouponModel,
  BannerContentModel,
  VirtualClosetModel,
  SavedOutfitModel,
  AILog,
  normalizeProductInventory,
};