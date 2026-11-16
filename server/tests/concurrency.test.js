process.env.MONGODB_URI = '';
const request = require('supertest');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const app = require('../index');
const { ProductModel, UserModel, OrderModel } = require('../models');

describe('Atomic counters and compare-and-swap on MongoDB', () => {
  test('50 rejected logins increment the stored counter exactly 50 times', async () => {
    const user = await UserModel.create({email:'counter@test.com',password:await bcrypt.hash('Correct123!',4)});
    const replies = await Promise.all(Array.from({length:50},() => request(app).post('/api/auth/login')
      .send({email:user.email,password:'wrong'})));
    expect(replies.every(r => r.status===401)).toBe(true);
    const saved = await UserModel.findById(user._id).select('+failedLoginCount');
    expect(saved.failedLoginCount).toBe(50);
    expect((await UserModel.findById(user._id)).failedLoginCount).toBeUndefined();
  });

  test.each(['product','user','order'])('%s accepts exactly one update for the same version', async kind => {
    const Model = {product:ProductModel,user:UserModel,order:OrderModel}[kind];
    const data = kind==='user' ? {email:'cas@test.com',password:'hash',fullName:'initial'} :
      kind==='order' ? {userId:new mongoose.Types.ObjectId(),products:[],totalAmount:0,shippingInfo:{}} : {id:98765,name:'initial',price:200000,stock:10};
    const doc = await Model.create(data);
    const field = kind==='product' ? 'stock' : kind==='user' ? 'fullName' : 'status';
    const values = kind==='product' ? [11,12] : ['first','second'];
    const url = kind==='product' ? `/api/products/${doc.id}` : kind==='user' ? `/api/users/${doc._id}` : `/api/orders/${doc._id}`;
    const outcomes = await Promise.all(values.map(value => request(app).put(url).send({[field]:value,__v:0})));
    expect(outcomes.map(r=>r.status).sort()).toEqual([200,409]);
    const saved=await Model.findById(doc._id);
    expect(saved.__v).toBe(1);
    expect(saved[field]).toBe(outcomes.find(r=>r.status===200).body[field]);
  });
});
