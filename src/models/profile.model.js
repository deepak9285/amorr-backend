import mongoose from "mongoose";

const ProfileSchema = new mongoose.Schema({
  userID: { type: Schema.Types.ObjectId, ref: 'User' },
  profilePic: { type: String },
  bio: { type: String },
  gender: { type: String },
  dob: { type: Date }
});

const Profile = mongoose.model('Profile', ProfileSchema);
export {Profile};