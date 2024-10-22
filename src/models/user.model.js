import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const {Schema} = mongoose

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  isEmailVerified: {
    type: Boolean,
    required: true,
    default: false
  },
  password: {
    type: String,
    required: true
  },
  refreshToken: String,
  accessToken: String,
  security: { type: String }, 
  signUpMethod: { type: String },
  referralCode: { type: String },
  loginHistory:[{
    ipaddress:{
      type:String,
      required:true
    },
    deviceName:String,
    deviceType:String,
    location:String,
    timeOfLogin:{
      type:String,
      required:true
    },
  }],
  profileID: { type: Schema.Types.ObjectId, ref: 'Profile' },
  addressID: { type: Schema.Types.ObjectId, ref: 'Address' },
  userPreferencesID: { type: Schema.Types.ObjectId, ref: 'UserPreferences' },
  activityIds: [{ type: Schema.Types.ObjectId, ref: 'ActivityCollection' }],
  milestones: [{ type: Schema.Types.ObjectId, ref: 'UserMilestone' }]
}, {
  timestamps:true
});




//Generating Access and Refresh Token method

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

//Password Validation Method

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};


const User = mongoose.model("user", userSchema);

export { User };