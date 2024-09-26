import mongoose from "mongoose";



const AddressSchema = new mongoose.Schema({
  userID: { type: Schema.Types.ObjectId, ref: 'User' },
  pincode: { type: Number },
  city: { type: String },
  state: { type: String },
  country: { type: String },
  longitude: { type: String },
  latitude: { type: String }
});

const Address = mongoose.model('Address', AddressSchema);

export {Address};