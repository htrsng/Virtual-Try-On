/**
 * STUB DATASTORE cho harness fuzzing Chuong 4.
 * ================================================================
 * QUAN TRONG: file nay KHONG PHAI la models.js that cua du an VFitAI.
 * No la mot lop gia lap (test double) chi mo phong DUNG cac phuong thuc
 * Mongoose ma cac route muc tieu su dung, boi vi moi truong sandbox
 * chay fuzzer KHONG tai duoc MongoDB binary that (fastdl.mongodb.org
 * khong nam trong whitelist mang). Toan bo logic nghiep vu trong
 * index.js va middleware.js duoc giu nguyen 100% khong sua doi -
 * CHI co tang luu tru la bi thay the.
 *
 * ----------------------------------------------------------------
 * CHANGELOG (mo rong cho cac module kiem thu an toan: OrderStatus,
 * UserAdmin, Product). Cac hanh vi cu cua POST /api/auth/login va
 * POST /api/orders KHONG bi thay doi.
 * ----------------------------------------------------------------
 * [FIX-1] chainable() ho tro them .limit()/.populate() va .select()
 *         THAT SU loc truong (truoc day select() la no-op, nen
 *         `.select("-password")` van tra ve password -> se gay
 *         false-positive "ro ri mat khau" khi fuzz).
 * [FIX-2] UserModel.findByIdAndUpdate / OrderModel.findByIdAndUpdate
 *         tra ve doi tuong chainable (route goi `.select("-password")`
 *         truc tiep len ket qua; ban cu tra Promise nen se TypeError
 *         -> 500 GIA cho PUT /api/users/:id va PUT /api/auth/profile).
 * [FIX-3] Cac ham findById / findByIdAndUpdate / findByIdAndDelete ep kieu ObjectId cho tham so
 *         :id nhu Mongoose that (id sai dinh dang -> CastError -> 500).
 * [FIX-4] findByIdAndUpdate cua User chi nhan cac truong co trong
 *         schema (strict mode) va bo qua gia tri undefined nhu
 *         Mongoose that. Order.status duoc ep kieu String.
 * [NEW-1] ProductModel stub (truoc day la {}), gom ep kieu Number cho
 *         id/price/stock/totalStock.
 * [NEW-2] NotificationModel stub toi thieu (createNotification() khong
 *         con nem TypeError roi bi nuot).
 * [NEW-3] Seed them: 1 admin, 1 user "victim", 1 san pham id=1.
 *
 * GIA DINH CAN DOI CHIEU VOI models.js THAT (danh dau [ASSUMPTION]):
 *   - ProductSchema: truong nao la Number, truong nao bat buoc.
 *   - OrderSchema.status la String tu do (khong enum) - khop mo hinh
 *     Kripke ACTUAL (PUT /api/orders/:id khong gioi han gia tri).
 */
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const branchTrace = require("./branch_trace");

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

// [FIX-3/4] CastError tong quat cho kieu khac Number (ObjectId, String).
class FakeTypedCastError extends Error {
  constructor(type, path, value) {
    let shown;
    try { shown = JSON.stringify(value); } catch (_) { shown = String(value); }
    super(`Cast to ${type} failed for value ${shown} (type ${typeof value}) at path "${path}"`);
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
  const trace = (id, condition) => path === "totalAmount" ? branchTrace.branch(id, condition) : condition;
  if (trace("cast.empty", value === undefined || value === null)) return value;
  if (trace("cast.number", typeof value === "number")) {
    if (!Number.isFinite(value)) throw new FakeCastError(path, value);
    return value;
  }
  if (trace("cast.boolean", typeof value === "boolean")) return value ? 1 : 0;
  const n = Number(value);
  if (trace("cast.invalid", Number.isNaN(n) || (typeof value === "object"))) {
    throw new FakeCastError(path, value);
  }
  return n;
}

// [FIX-4] Ep kieu String giong Mongoose: number/boolean duoc chuyen
// thanh chuoi, object/array -> CastError.
function castStringOrThrow(path, value) {
  if (value === undefined || value === null) return value;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  throw new FakeTypedCastError("string", path, value);
}

// [FIX-3] Ep kieu ObjectId cho tham so :id. Tra ve chuoi id hop le.
function castObjectIdOrThrow(value, path = "_id") {
  if (value instanceof mongoose.Types.ObjectId) return String(value);
  if (value === null || typeof value === "object" || value === undefined) {
    throw new FakeTypedCastError("ObjectId", path, value);
  }
  const s = String(value);
  if (!mongoose.Types.ObjectId.isValid(s)) {
    throw new FakeTypedCastError("ObjectId", path, value);
  }
  return s;
}

// [FIX-4] Strict mode: chi giu cac truong nam trong schema, bo qua undefined.
function pickFields(src, allowed) {
  const out = {};
  if (!src || typeof src !== "object") return out;
  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(src, k) && src[k] !== undefined) {
      out[k] = src[k];
    }
  }
  return out;
}

// [FIX-1] Loc truong theo .select(): "-password" (loai tru) hoac "id name" (chi lay).
function projectOne(doc, spec) {
  if (doc === null || typeof doc !== "object") return doc;
  const tokens = String(spec).split(/\s+/).filter(Boolean);
  if (!tokens.length) return doc;
  const excluding = tokens.every((t) => t.startsWith("-"));
  const out = {};
  if (excluding) {
    const ex = new Set(tokens.map((t) => t.slice(1)));
    for (const [k, v] of Object.entries(doc)) {
      if (!ex.has(k) && typeof v !== "function") out[k] = v;
    }
  } else {
    out._id = doc._id;
    for (const t of tokens) if (t in doc) out[t] = doc[t];
  }
  return out;
}

function applySelect(result, spec) {
  if (!spec) return result;
  if (Array.isArray(result)) return result.map((d) => projectOne(d, spec));
  return projectOne(result, spec);
}

// Query object co the "await" truc tiep (thenable) va ho tro chain
// .select()/.sort()/.limit()/.populate()/.lean() giong Mongoose.
// sort()/populate() van la no-op (du de fuzz cac route muc tieu).
function chainable(resolver) {
  let selectSpec = null;
  const q = {
    select(spec) { selectSpec = spec; return q; },
    sort() { return q; },
    limit() { return q; },
    populate() { return q; },
    lean() { return q; },
    then(onFulfilled, onRejected) {
      return Promise.resolve()
        .then(resolver)
        .then((r) => applySelect(r, selectSpec))
        .then(onFulfilled, onRejected);
    },
    catch(onRejected) {
      return q.then(undefined, onRejected);
    },
  };
  return q;
}

// ---------------- UserModel ----------------
const _users = new Map(); // id(string) -> user object

function atomicUpdate(store, filter, update, fields, cast = x => x) {
  return chainable(() => {
    const id = filter._id === undefined ? undefined : castObjectIdOrThrow(filter._id);
    const doc = Array.from(store.values()).find(d =>
      (id === undefined || String(d._id) === id) &&
      (filter.email === undefined || d.email === filter.email) &&
      (filter.__v === undefined || (d.__v || 0) === filter.__v));
    if (!doc) return null;
    const patch = cast(pickFields(update.$set || {}, fields));
    for (const [key, amount] of Object.entries(update.$inc || {})) {
      if (['__v','failedLoginCount'].includes(key)) patch[key] = (doc[key] || 0) + amount;
    }
    Object.assign(doc, patch);
    return doc;
  });
}

// Cac truong cua UserSchema (theo cac truong ma constructor ben duoi su dung).
const USER_FIELDS = [
  "email", "password", "role", "fullName", "phone", "address",
  "city", "district", "ward", "addresses",
];

const UserModel = {
  async findOne(filter = {}) {
    for (const u of _users.values()) {
      if (filter._id !== undefined && String(u._id) !== castObjectIdOrThrow(filter._id)) continue;
      if (filter.email !== undefined && u.email !== filter.email) continue;
      return u;
    }
    return null;
  },
  findOneAndUpdate(filter, update) { return atomicUpdate(_users, filter, update, USER_FIELDS); },
  findById(id) {
    return chainable(() => _users.get(castObjectIdOrThrow(id)) || null);
  },
  find(filter = {}) {
    return chainable(() => Array.from(_users.values()));
  },
  // [FIX-2] chainable de `.select("-password")` hoat dong nhu that.
  findByIdAndUpdate(id, update, opts = {}) {
    return chainable(() => {
      const u = _users.get(castObjectIdOrThrow(id));
      if (!u) return null;
      const src = (update && update.$set) || update || {};
      Object.assign(u, pickFields(src, USER_FIELDS));
      return u;
    });
  },
  async findByIdAndDelete(id) {
    const key = castObjectIdOrThrow(id);
    const u = _users.get(key) || null;
    _users.delete(key);
    return u;
  },
  async deleteMany() {
    const n = _users.size;
    _users.clear();
    return { deletedCount: n };
  },
};

function UserModelCtor(data) {
  this.__v = 0;
  this.failedLoginCount = 0;
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
  findOneAndUpdate(filter, update) {
    return atomicUpdate(_orders, filter, update, ['status'], patch => {
      if (patch.status !== undefined) patch.status = castStringOrThrow('status', patch.status);
      return patch;
    });
  },
  findById(id) {
    return chainable(() => _orders.get(castObjectIdOrThrow(id)) || null);
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
      if (filter._id !== undefined && String(o._id) !== castObjectIdOrThrow(filter._id)) continue;
      if (filter.userId !== undefined && String(o.userId) !== String(filter.userId)) continue;
      return o;
    }
    return null;
  },
  // [FIX-2/3/4] chainable + ep kieu ObjectId + bo qua undefined + status la String.
  findByIdAndUpdate(id, update, opts = {}) {
    return chainable(() => {
      const o = _orders.get(castObjectIdOrThrow(id));
      if (!o) return null;
      const src = (update && update.$set) || update || {};
      for (const [k, v] of Object.entries(src)) {
        if (v === undefined) continue;
        o[k] = k === "status" ? castStringOrThrow("status", v) : v;
      }
      return o;
    });
  },
  async findByIdAndDelete(id) {
    const key = castObjectIdOrThrow(id);
    const o = _orders.get(key) || null;
    _orders.delete(key);
    return o;
  },
  async deleteMany() {
    const n = _orders.size;
    _orders.clear();
    return { deletedCount: n };
  },
};

function OrderModelCtor(data) {
  this.__v = 0;
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
    if (branchTrace.branch("order.total.required", this.totalAmount === undefined || this.totalAmount === null)) {
      throw new FakeValidationError("Order validation failed: totalAmount: Path `totalAmount` is required.");
    }
    // Ep kieu Number giong Mongoose that - co the throw CastError (xem
    // castNumberOrThrow o tren). HTTP 500 la loi ung dung, khong tu
    // chung minh crash tien trinh hay loi bo nho.
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

// ---------------- ProductModel [NEW-1] ----------------
// [ASSUMPTION] Schema gia dinh, can doi chieu voi ProductSchema that.
// Khong dat rang buoc "required" nao (xem PRODUCT_REQUIRED) vi chua co schema that.
const _products = new Map();
const PRODUCT_FIELDS = [
  "id", "name", "price", "stock", "totalStock", "category",
  "description", "image", "variants", "ai_attributes",
];
const PRODUCT_NUMBER_FIELDS = ["id", "price", "stock", "totalStock"];
const PRODUCT_STRING_FIELDS = ["name", "category", "description", "image"];
const PRODUCT_REQUIRED = []; // vd: ["name", "price"] sau khi doi chieu schema that

function castProductFields(obj) {
  for (const f of PRODUCT_NUMBER_FIELDS) {
    if (f in obj) obj[f] = castNumberOrThrow(f, obj[f]);
  }
  for (const f of PRODUCT_STRING_FIELDS) {
    if (f in obj) obj[f] = castStringOrThrow(f, obj[f]);
  }
  return obj;
}

// Khop bo loc do buildProductLookupFilter() trong index.js sinh ra:
//   {_id: "<chuoi>"}  (ep kieu ObjectId - sai dinh dang thi CastError)
//   {id: <so>}
//   {id: {$type: "number"}}
function productMatches(p, filter = {}) {
  if (filter.__v !== undefined && (p.__v || 0) !== filter.__v) return false;
  if (filter._id !== undefined) {
    if (String(p._id) !== castObjectIdOrThrow(filter._id)) return false;
  }
  if (filter.id !== undefined) {
    if (filter.id !== null && typeof filter.id === "object") {
      if (filter.id.$type === "number" && typeof p.id !== "number") return false;
    } else if (p.id !== filter.id) {
      return false;
    }
  }
  return true;
}

function productQuery(filter, single) {
  let sortSpec = null;
  let selectSpec = null;
  const q = {
    sort(s) { sortSpec = s; return q; },
    limit() { return q; },
    select(s) { selectSpec = s; return q; },
    lean() { return q; },
    then(onFulfilled, onRejected) {
      return Promise.resolve()
        .then(() => {
          let arr = Array.from(_products.values()).filter((p) => productMatches(p, filter));
          if (sortSpec) {
            const keys = Object.entries(sortSpec);
            arr.sort((a, b) => {
              for (const [k, dir] of keys) {
                if (a[k] < b[k]) return -dir;
                if (a[k] > b[k]) return dir;
              }
              return 0;
            });
          }
          return applySelect(single ? arr[0] || null : arr, selectSpec);
        })
        .then(onFulfilled, onRejected);
    },
    catch(onRejected) { return q.then(undefined, onRejected); },
  };
  return q;
}

const ProductModelStatics = {
  find(filter = {}) { return productQuery(filter, false); },
  findOne(filter = {}) { return productQuery(filter, true); },
  findOneAndUpdate(filter = {}, update = {}, opts = {}) {
    return chainable(() => {
      const p = Array.from(_products.values()).find((x) => productMatches(x, filter));
      if (!p) return null;
      const src = update.$set || update;
      const patch = castProductFields(pickFields(src, PRODUCT_FIELDS));
      Object.assign(p, patch);
      if (update.$inc?.__v) p.__v = (p.__v || 0) + update.$inc.__v;
      return p;
    });
  },
  findOneAndDelete(filter = {}) {
    return chainable(() => {
      const p = Array.from(_products.values()).find((x) => productMatches(x, filter));
      if (!p) return null;
      _products.delete(String(p._id));
      return p;
    });
  },
  findByIdAndUpdate(id, update = {}) {
    return ProductModelStatics.findOneAndUpdate({ _id: id }, update);
  },
  async deleteMany() {
    const n = _products.size;
    _products.clear();
    return { deletedCount: n };
  },
};

function ProductModelCtor(data) {
  this.__v = 0;
  Object.assign(this, pickFields(data || {}, PRODUCT_FIELDS));
  this._id = newId();
  this.createdAt = new Date();
  this.markModified = () => { };
  this.toObject = () => {
    const o = { ...this };
    delete o.save; delete o.markModified; delete o.toObject;
    return o;
  };
  this.save = async () => {
    for (const f of PRODUCT_REQUIRED) {
      if (this[f] === undefined || this[f] === null || this[f] === "") {
        throw new FakeValidationError(`Product validation failed: ${f}: Path \`${f}\` is required.`);
      }
    }
    castProductFields(this);
    _products.set(this._id.toString(), this);
    return this;
  };
}
Object.assign(ProductModelCtor, ProductModelStatics);

// ---------------- NotificationModel [NEW-2] ----------------
const _notifications = [];
function NotificationModelCtor(data) {
  Object.assign(this, data);
  this._id = newId();
  this.save = async () => { _notifications.push(this); return this; };
}
NotificationModelCtor.find = (filter = {}) => chainable(() =>
  _notifications.filter(n => Object.entries(filter).every(([key, value]) => String(n[key]) === String(value))));

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
// [NEW-3] Them: admin (kiem tra phan quyen), victim (kiem tra sua/xoa
// user KHAC - IDOR/BOLA), va 1 san pham (khop seed_order_valid.json).
const SEED_ADMIN_EMAIL = "fuzzadmin@test.com";
const SEED_ADMIN_PASSWORD = "Admin123!";
const SEED_VICTIM_EMAIL = "victim@test.com";
const SEED_VICTIM_PASSWORD = "Victim123!";
(function seed() {
  const u = new UserModelCtor({
    email: SEED_EMAIL,
    password: bcrypt.hashSync(SEED_PASSWORD, 10),
    role: "user",
    fullName: "Fuzz Test User",
  });
  // Stable fixture identities keep JWT subjects valid across isolated Node runs.
  u._id = new mongoose.Types.ObjectId("000000000000000000000001");
  _users.set(u._id.toString(), u);

  // Dung cost thap (4) cho user phu de khong lam cham viec spawn tien
  // trinh Node moi o moi lan thu cua white-box fuzzer.
  const admin = new UserModelCtor({
    email: SEED_ADMIN_EMAIL,
    password: bcrypt.hashSync(SEED_ADMIN_PASSWORD, 4),
    role: "admin",
    fullName: "Fuzz Admin",
  });
  admin._id = new mongoose.Types.ObjectId("000000000000000000000003");
  _users.set(admin._id.toString(), admin);

  const victim = new UserModelCtor({
    email: SEED_VICTIM_EMAIL,
    password: bcrypt.hashSync(SEED_VICTIM_PASSWORD, 4),
    role: "user",
    fullName: "Victim User",
  });
  victim._id = new mongoose.Types.ObjectId("000000000000000000000002");
  _users.set(victim._id.toString(), victim);

  const p = new ProductModelCtor({
    id: 1, name: "Ao thun", price: 200000, stock: 10, totalStock: 10,
    category: "Ao",
  });
  _products.set(p._id.toString(), p);
})();

module.exports = {
  ProductModel: ProductModelCtor,
  UserModel: UserModelCtor,
  OrderModel: OrderModelCtor,
  WishlistModel: {},
  ReviewModel: {},
  ChatMessageModel: {},
  NotificationModel: NotificationModelCtor,
  ViewHistoryModel: {},
  NewsletterModel,
  UsedCouponModel,
  BannerContentModel: {},
  VirtualClosetModel: {},
  SavedOutfitModel: {},
  AILog: {},
  TryonSessionModel: {},
  normalizeProductInventory: (x) => x,
  __seed: {
    SEED_EMAIL, SEED_PASSWORD,
    SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD,
    SEED_VICTIM_EMAIL, SEED_VICTIM_PASSWORD,
  },
};
