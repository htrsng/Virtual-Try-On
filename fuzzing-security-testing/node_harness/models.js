/**
 * STUB DATASTORE cho harness fuzzing Chuong 4.
 * ================================================================
 * QUAN TRONG: file nay KHONG PHAI la models.js that cua du an VFitAI.
 * No la mot lop gia lap (test double) chi mo phong DUNG cac phuong thuc
 * Mongoose ma 2 route muc tieu (POST /api/auth/login, POST /api/orders
 * va cac route lien quan truc tiep) su dung, boi vi moi truong sandbox
 * chay fuzzer KHONG tai duoc MongoDB binary that (fastdl.mongodb.org
 * khong nam trong whitelist mang). Toan bo logic nghiep vu trong
 * index.js va middleware.js duoc giu nguyen 100% khong sua doi -
 * CHI co tang luu tru la bi thay the.
 *
 * Muc dich: cho phep chay dong (dynamic testing / fuzzing) that su
 * tren chinh route handler that, thay vi chi phan tich tinh.
 */
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const newId = () => new mongoose.Types.ObjectId();

class FakeValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

class FakeDuplicateKeyError extends Error {
  constructor(field) {
    super(`E11000 duplicate key error: ${field}`);
    this.name = "MongoServerError";
    this.code = 11000;
  }
}

class FakeCastError extends Error {
  constructor(path, value) {
    super(`Cast to Number failed for value "${JSON.stringify(value)}" at path "${path}"`);
    this.name = "CastError";
  }
}

// Mo phong DUNG hanh vi ep kieu (type casting) cua Mongoose that cho
// truong kieu Number: neu gia tri KHONG undefined/null va KHONG the ep
// ve mot so huu han, Mongoose that se throw CastError ngay khi save().
// Day la mot lop loi rat that (type confusion / CWE-20) ma ban stub
// truoc day (khong ep kieu) se BO SOT - fuzzer se khong tim ra neu
// thieu doan nay.
function castNumberOrThrow(path, value) {
  if (value === undefined || value === null) return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new FakeCastError(path, value);
    return value;
  }
  if (typeof value === "boolean") return value ? 1 : 0;
  const n = Number(value);
  if (Number.isNaN(n) || (typeof value === "object")) {
    throw new FakeCastError(path, value);
  }
  return n;
}

// Query object co the "await" truc tiep (thenable) va ho tro chain
// .select()/.sort()/.lean() giong Mongoose, du khong thuc su lam gi
// voi projection/sort (du de fuzz 2 route muc tieu khong can chinh xac
// tuyet doi phan nay).
function chainable(resolver) {
  const q = {
    select() { return q; },
    sort() { return q; },
    lean() { return q; },
    then(onFulfilled, onRejected) {
      return Promise.resolve().then(resolver).then(onFulfilled, onRejected);
    },
    catch(onRejected) {
      return this.then(undefined, onRejected);
    },
  };
  return q;
}

// ---------------- UserModel ----------------
const _users = new Map(); // id(string) -> user object

const UserModel = {
  async findOne(filter = {}) {
    for (const u of _users.values()) {
      if (filter.email !== undefined && u.email !== filter.email) continue;
      return u;
    }
    return null;
  },
  findById(id) {
    return chainable(() => _users.get(String(id)) || null);
  },
  find(filter = {}) {
    return chainable(() => Array.from(_users.values()));
  },
  async findByIdAndUpdate(id, update, opts = {}) {
    const u = _users.get(String(id));
    if (!u) return null;
    const src = update.$set || update;
    Object.assign(u, src);
    return u;
  },
  async findByIdAndDelete(id) {
    const u = _users.get(String(id)) || null;
    _users.delete(String(id));
    return u;
  },
  async deleteMany() {
    const n = _users.size;
    _users.clear();
    return { deletedCount: n };
  },
};

function UserModelCtor(data) {
  this._id = newId();
  this.email = data.email;
  this.password = data.password;
  this.role = data.role || "user";
  this.fullName = data.fullName || "";
  this.phone = data.phone || "";
  this.address = data.address || "";
  this.city = data.city || "";
  this.district = data.district || "";
  this.ward = data.ward || "";
  this.addresses = data.addresses || [];
  this.createdAt = new Date();
  this.save = async () => {
    if (!this.email || !this.password) {
      throw new FakeValidationError("email va password la bat buoc");
    }
    for (const u of _users.values()) {
      if (u.email === this.email && u._id.toString() !== this._id.toString()) {
        throw new FakeDuplicateKeyError("email");
      }
    }
    _users.set(this._id.toString(), this);
    return this;
  };
}
Object.assign(UserModelCtor, UserModel);

// ---------------- OrderModel ----------------
const _orders = new Map();

const OrderModelStatics = {
  findById(id) {
    return chainable(() => _orders.get(String(id)) || null);
  },
  find(filter = {}) {
    return chainable(() => {
      let arr = Array.from(_orders.values());
      if (filter.userId !== undefined) {
        arr = arr.filter((o) => String(o.userId) === String(filter.userId));
      }
      return arr;
    });
  },
  async findOne(filter = {}) {
    for (const o of _orders.values()) {
      if (filter.userId !== undefined && String(o.userId) !== String(filter.userId)) continue;
      return o;
    }
    return null;
  },
  async findByIdAndUpdate(id, update, opts = {}) {
    const o = _orders.get(String(id));
    if (!o) return null;
    const src = update.$set || update;
    Object.assign(o, src);
    return o;
  },
  async findByIdAndDelete(id) {
    const o = _orders.get(String(id)) || null;
    _orders.delete(String(id));
    return o;
  },
  async deleteMany() {
    const n = _orders.size;
    _orders.clear();
    return { deletedCount: n };
  },
};

function OrderModelCtor(data) {
  this._id = newId();
  this.userId = data.userId;
  this.products = data.products;
  this.totalAmount = data.totalAmount;
  this.discountCode = data.discountCode || "";
  this.discountAmount = data.discountAmount || 0;
  this.voucherCode = data.voucherCode || "";
  this.voucherDiscount = data.voucherDiscount || 0;
  this.shippingFee = data.shippingFee || 0;
  this.shippingMethod = data.shippingMethod || "Tiêu chuẩn";
  this.shippingInfo = data.shippingInfo;
  this.paymentMethod = data.paymentMethod || "COD";
  this.status = data.status || "Đang xử lý";
  this.createdAt = new Date();
  this.save = async () => {
    // Mo phong dung rang buoc "required: true" cua OrderSchema that
    // (userId, totalAmount). KHONG co rang buoc min/max nao khac -
    // dung y het schema that trong models.js goc (xem BUG-06).
    if (this.userId === undefined || this.userId === null) {
      throw new FakeValidationError("Order validation failed: userId: Path `userId` is required.");
    }
    if (this.totalAmount === undefined || this.totalAmount === null) {
      throw new FakeValidationError("Order validation failed: totalAmount: Path `totalAmount` is required.");
    }
    // Ep kieu Number giong Mongoose that - co the throw CastError (xem
    // castNumberOrThrow o tren). Day la nguon "crash" (500) chinh ma
    // fuzzer o Chuong 4 duoc ky vong tim ra qua type confusion.
    this.totalAmount = castNumberOrThrow("totalAmount", this.totalAmount);
    this.discountAmount = castNumberOrThrow("discountAmount", this.discountAmount);
    this.voucherDiscount = castNumberOrThrow("voucherDiscount", this.voucherDiscount);
    this.shippingFee = castNumberOrThrow("shippingFee", this.shippingFee);
    _orders.set(this._id.toString(), this);
    return this;
  };
}
Object.assign(OrderModelCtor, OrderModelStatics);

// ---------------- UsedCouponModel ----------------
const _usedCoupons = new Map();

const UsedCouponModel = {
  async findOne(filter = {}) {
    for (const c of _usedCoupons.values()) {
      if (filter.userId !== undefined && String(c.userId) !== String(filter.userId)) continue;
      if (filter.couponCode !== undefined && c.couponCode !== filter.couponCode) continue;
      return c;
    }
    return null;
  },
  find(filter = {}) {
    return chainable(() => {
      let arr = Array.from(_usedCoupons.values());
      if (filter.userId !== undefined) arr = arr.filter((c) => String(c.userId) === String(filter.userId));
      if (filter.couponCode !== undefined) arr = arr.filter((c) => c.couponCode === filter.couponCode);
      return arr;
    });
  },
  async countDocuments(filter = {}) {
    const list = await UsedCouponModel.find(filter);
    return list.length;
  },
  async create(data) {
    for (const c of _usedCoupons.values()) {
      if (String(c.userId) === String(data.userId) && c.couponCode === data.couponCode) {
        throw new FakeDuplicateKeyError("userId_couponCode");
      }
    }
    const doc = { _id: newId(), usedAt: new Date(), ...data };
    _usedCoupons.set(doc._id.toString(), doc);
    return doc;
  },
  async deleteMany() {
    const n = _usedCoupons.size;
    _usedCoupons.clear();
    return { deletedCount: n };
  },
};

// ---------------- NewsletterModel ----------------
const _newsletters = new Map();
const NewsletterModel = {
  async updateOne(filter = {}, update = {}) {
    let matched = 0;
    for (const n of _newsletters.values()) {
      if (filter.couponCode !== undefined && n.couponCode !== filter.couponCode) continue;
      if (filter.isUsed !== undefined && n.isUsed !== filter.isUsed) continue;
      Object.assign(n, update.$set || {});
      matched += 1;
    }
    return { matchedCount: matched, modifiedCount: matched };
  },
};

// ---------------- Seed du lieu test co dinh ----------------
// 1 tai khoan hop le de black-box/white-box fuzzer co the dang nhap
// thanh cong va lay token that truoc khi fuzz cac field khac.
const SEED_EMAIL = "fuzzuser@test.com";
const SEED_PASSWORD = "Fuzz123!";
(function seed() {
  const u = new UserModelCtor({
    email: SEED_EMAIL,
    password: bcrypt.hashSync(SEED_PASSWORD, 10),
    role: "user",
    fullName: "Fuzz Test User",
  });
  _users.set(u._id.toString(), u);
})();

module.exports = {
  ProductModel: {},
  UserModel: UserModelCtor,
  OrderModel: OrderModelCtor,
  WishlistModel: {},
  ReviewModel: {},
  ChatMessageModel: {},
  NotificationModel: {},
  ViewHistoryModel: {},
  NewsletterModel,
  UsedCouponModel,
  BannerContentModel: {},
  VirtualClosetModel: {},
  SavedOutfitModel: {},
  AILog: {},
  TryonSessionModel: {},
  normalizeProductInventory: (x) => x,
  __seed: { SEED_EMAIL, SEED_PASSWORD },
};
