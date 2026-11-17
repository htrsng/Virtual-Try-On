const mongoose = require("mongoose");
const { UserModel } = require("../models");

async function listAddresses(req, res) {
  try {
    const user = await UserModel.findById(req.user.id).select('addresses');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ addresses: user.addresses || [] });
  } catch (err) {
    console.error('Error fetching addresses:', err);
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
}

async function addAddress(req, res) {
  try {
    const { fullName, phone, province, district, ward, street, isDefault, type } = req.body;

    if (!fullName || !phone || !province || !district || !ward || !street) {
      return res.status(400).json({ error: 'Missing required address fields' });
    }

    const newAddr = {
      _id: new mongoose.Types.ObjectId(),
      fullName,
      phone,
      province,
      district,
      ward,
      street,
      isDefault: !!isDefault,
      type: type || 'home'
    };

    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (newAddr.isDefault) {
      user.addresses.forEach((address) => {
        address.isDefault = false;
      });
    }

    user.addresses.push(newAddr);
    await user.save();

    res.json({ success: true, address: newAddr });
  } catch (err) {
    console.error('Error adding address:', err);
    res.status(500).json({ error: 'Failed to add address' });
  }
}

async function updateAddress(req, res) {
  try {
    const { addressId } = req.params;
    const { fullName, phone, province, district, ward, street, isDefault, type } = req.body;

    if (!fullName || !phone || !province || !district || !ward || !street) {
      return res.status(400).json({ error: 'Missing required address fields' });
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    address.fullName = fullName;
    address.phone = phone;
    address.province = province;
    address.district = district;
    address.ward = ward;
    address.street = street;
    address.isDefault = !!isDefault;
    address.type = type || 'home';

    if (address.isDefault) {
      user.addresses.forEach((item) => {
        if (String(item._id) !== String(address._id)) {
          item.isDefault = false;
        }
      });
    }

    await user.save();
    res.json({ success: true, address: address.toObject() });
  } catch (err) {
    console.error('Error updating address:', err);
    res.status(500).json({ error: 'Failed to update address' });
  }
}

module.exports = { listAddresses, addAddress, updateAddress };
