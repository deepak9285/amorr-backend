import mongoose from "mongoose";

const { Schema } = mongoose;

const ProfileSchema = new mongoose.Schema(
  {
    userID: { type: Schema.Types.ObjectId, ref: "User" },
    profileHash: {
      type: String,
      required: false,
      unique: true,
    },
    amorrID: {
      type: String,
      required: false,
      unique: true,
    },
    username: { type: String },
    profilePic: { type: String },
    bio: { type: String },
    gender: {
      type: String,
      enum: ["m", "f", "o"],
    },
    lookingFor: {
      type: String,
      enum: ["m", "f", "o"],
    },
    location: {
      latitude: { type: Number, required: true, min: -90, max: 90 },
      longitude: { type: Number, required: true, min: -180, max: 180 },
    },

    dob: { type: Date },
    height: {
      type: String,
    },
    relationshipPreference: {
      type: String,
      enum: [
        "Life Long partner",
        "Long Term Relationship",
        "Short Term Relationship",
        "Friendship & Connection",
        "Situationship",
        "Something casual",
      ],
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    dislikes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    matches: [
      {
        senderID: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        recieverID: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending",
        },
      },
    ],
    preferredProfiles: [
      {
        match: { type: Schema.Types.ObjectId, ref: "User" },
        score: { type: Number, required: true },
      },
    ],
    userPhotos: [
      {
        label: {
          type: String,
        },
        url: {
          type: String,
          unique: true,
        },
      },
    ],
    promptsAnswers: [
      {
        prompt: String,
        ans: String,
      },
    ],
    completeness: Number,
  },
  {
    timestamps: true,
  }
);

const Profile = mongoose.model("Profile", ProfileSchema);
export { Profile };
