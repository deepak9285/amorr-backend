import mongoose from "mongoose";

const {Schema} = mongoose;

const AddressSchema = new mongoose.Schema({
  userID: { type: Schema.Types.ObjectId, ref: 'User' },
  pincode: { type: Number },
  city: { type: String },
  state: { type: String },
  country: { type: String },
  longitude: { type: String },
  latitude: { type: String }
},{
  timestamps:true
});

const Address = mongoose.model('Address', AddressSchema);

export {Address};