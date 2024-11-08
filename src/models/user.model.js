import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const { Schema } = mongoose;

const  userSchema = new mongoose.Schema(
  {
    amorrID: {
      type: String,
      required: true,
      unique: true,
    },
    userHash: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      unique: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    isEmailVerified: {
      type: Boolean,
      required: true,
      default: false,
    },
    isAadharVerified: {
      type: Boolean,
      required: true,
      default: false,
    },
    password: {
      type: String,
      required: true,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    refreshToken: String,
    accessToken: String,
    security: { type: String },
    signUpMethod: { type: String },
    referralCode: { type: String },
    loginHistory: [
      {
        ipaddress: {
          type: String,
          required: true,
        },
        deviceName: String,
        deviceType: String,
        location: String,
        timeOfLogin: {
          type: String,
          required: true,
        },
      },
    ],
    profileID: { type: Schema.Types.ObjectId, ref: "Profile" },
    addressID: { type: Schema.Types.ObjectId, ref: "Address" },
    userPreferencesID: { type: Schema.Types.ObjectId, ref: "UserPreferences" },
    activityIds: [{ type: Schema.Types.ObjectId, ref: "ActivityCollection" }],
    milestones: [{ type: Schema.Types.ObjectId, ref: "UserMilestone" }],
    points: { type: Number, default: 0 }
  },
  {
    timestamps: true,
  }
);

// Helper function to generate userHash using MD5
userSchema.methods.generateUserHash = function () {
  return crypto.createHash("md5").update(this.email).digest("hex");
};

// Helper function to generate a unique amorrID
userSchema.statics.generateAmorrID = async function () {
  let uniqueID;
  let isUnique = false;

  while (!isUnique) {
    uniqueID = Math.floor(10000000 + Math.random() * 90000000).toString();
    const existingUser = await this.findOne({ amorrID: uniqueID });
    if (!existingUser) isUnique = true;
  }
  return uniqueID;
};

userSchema.pre("save", async function (next) {
  if (!this.amorrID) {
    this.amorrID = await this.constructor.generateAmorrID();
  }
  if (!this.userHash) {
    this.userHash = this.generateUserHash();
  }
  next();
});

// Generating Access and Refresh Token methods
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

// Password Validation Method
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

export { User };
