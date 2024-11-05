import mongoose from "mongoose";

const { Schema } = mongoose;


const ProfileSchema = new mongoose.Schema({
  userID: { type: Schema.Types.ObjectId, ref: 'User' },
  profileHash: {
    type: String,
    required: true,
    unique: true,
  },
  amorrID: {
    type: String,
    required: true,
    unique: true
  },
  profilePic: { type: String },
  bio: { type: String },
  gender: {
    type: String,
    enum: ['m', 'f', 'o']
  },
  lookingFor: {
    type: String,
    enum: ['m', 'f', 'o']
  },
  location: { type: String },
  dob: { type: Date },
  height: {
    type: String
  },
  relationshipPreference: {
    type: String,
    enum: ['Life Long partner', 'Long Term Relationship', 'Short Term Relationship', 'Friship & Connection', 'Situationship', 'Something casual']
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  dislikes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  matches: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  preferredProfiles:[  {
    match: { type: Schema.Types.ObjectId, ref: 'User' },
    score: { type: Number, required: true }
  }],
  userPhotos: [
    {
      label: {
        type: String
      },
      url: {
        type: String,
        unique: true
      },
    }
  ],
  promptsAnswers: [
    {
      prompt:String,
      ans: String
    }
  ],
  completeness: Number
},
  {
    timestamps: true
  });

const Profile = mongoose.model('Profile', ProfileSchema);
export { Profile };