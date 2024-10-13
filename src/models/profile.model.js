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
  relationshipPreference:{
    type:String,
    enum:['Life Long partner', 'Long Term Relationship', 'Short Term Relationship', 'Friship & Connection', 'Situationship', 'Something casual'],
    required:true
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