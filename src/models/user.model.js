import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username:{
    type:String,
    required:true,
    unique:true
  },
  email:{
    type:String,
    required:true,
    unique:true
  },
  isEmailVerified:{
    type:Boolean,
    required:true,
    default:true
  },
  password:{
    type:String,
    required:true
  },
  refreshToken:String,
  accessToken:String
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

export {User};