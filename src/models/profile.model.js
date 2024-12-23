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
    specInterests: [
      {
        code: String,
        title: String,
        answer: String,
      },
    ],
    interests: [
      {
        type: String,
        default: "",
      }
    ],
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: false,
      },
      coordinates: {
        type: [Number],
        required: false,
        min: -180,
        max: 180,
      },
    },
    city: { type: String, default: "" },
    nativePlace: { type: String },
    dob: { type: Date },
    org: { type: String, default: "" },
    profession: { type: String, default: "" },
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
        "Something Casual",
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
          enum: ["pending", "accepted", "rejected", "chat"],
          default: "pending",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        }
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

ProfileSchema.index({ location: '2dsphere' });
const Profile = mongoose.model("Profile", ProfileSchema);
export { Profile };
