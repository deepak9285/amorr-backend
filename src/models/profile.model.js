import mongoose from "mongoose";

const {Schema} = mongoose;


const ProfileSchema = new mongoose.Schema({
  userID: { type: Schema.Types.ObjectId, ref: 'User' },
  profilePic: { type: String },
  bio: { type: String },
  gender: { 
    type: String,
    enum:['m', 'f', 'o']
  },
  dob: { type: Date },
  height:{
    type:String
  },
  
  likes:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:'User'
    }
  ]
},
{
  timestamps:true
});

const Profile = mongoose.model('Profile', ProfileSchema);
export {Profile};