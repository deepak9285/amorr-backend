import mongoose from "mongoose";

const {Schema} = mongoose;


const ProfileSchema = new mongoose.Schema({
  userID: { type: Schema.Types.ObjectId, ref: 'User' },
  profilePic: { type: String },
  bio: { type: String },
  gender: { type: String },
  dob: { type: Date }
},
{
  timestamps:true
});

const Profile = mongoose.model('Profile', ProfileSchema);
export {Profile};