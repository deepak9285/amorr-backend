import { Otp } from "../models/otp.model.js";
import { User } from "../models/user.model.js";
import { ApiError, handleErr } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import bcrypt from "bcrypt";
import { transporter } from "../utils/transporter.js";
import { v4 as uuidv4 } from "uuid";
import crypto from 'crypto';
import { Profile } from "../models/profile.model.js";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findOne(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (err) {
    console.log(err);
    return res.json(new ApiError(400, "Error generating token! ", err));
  }
};

const sendEmailOtp = async (req, res) => {
  try {
    console.log('send otp api');

    const { email } = req.body;
    // Delete all previous otps for the user
    await Otp.deleteMany({ email });
    const user = await User.findOne({ email });
    if (user.isEmailVerified) {
      return res.json(new ApiResponse(409, "Email already verified!"));
    }
    console.log('gen otp')
    // Generate a new otp
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    const mailOptions = {
      from: {
        name: process.env.AUTH_EMAIL_NAME,
        address: process.env.AUTH_EMAIL,
      },
      to: email,
      subject: "Verify your Email",
      html: `<p>Enter <b>${otp}</b> in the app to verify your email address and complete your signup</p><p>This otp expires in 10 minutes.</p>`,
    };

    const hashedOtp = await bcrypt.hash(otp, 12);
    const newOtp = new Otp({
      email,
      otp: hashedOtp,
    }).save();

    transporter.sendMail(mailOptions);
    return res.status(200).json(new ApiResponse(200, newOtp, "Otp sent successfully"));

  }
  catch (err) {
    console.log(err);
    return res.json(new ApiError(400, err.message));
  }
};

const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.json(new ApiResponse(410, "All fields are required!"));
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.json(new ApiResponse(409, "User already exists!"));
    }

    const hashedOtp = await Otp.findOne({ email });

    if (!hashedOtp) {
      return res.json(new ApiResponse(404, "Otp not found"));
    }

    const { createdAt } = hashedOtp;

    if (createdAt < Date.now() - 600000) {
      return res.json(
        new ApiResponse(422, "Otp has expired , please request again")
      );
    }

    const verify = bcrypt.compareSync(otp, hashedOtp.otp);

    if (verify) {
      await Otp.deleteOne({ email });
      return res.json(new ApiResponse(200, "Email verified successfully"));
    }
    else {
      return res.json(new ApiResponse(400, "Otp entered is wrong"));
    }

  }
  catch (err) {
    // console.log(err);
    return res.json(new ApiError(400, "verification failed", err.message));
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.json(new ApiResponse(410, "All fields are required!"));
    }
    const user = await User.findOne({ email });

    if (!user) {
      return res.json(new ApiResponse(404, null, "User not found!"));
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
      return res.json(new ApiResponse(401, null, "Password incorrect!"));
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
    };
    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    // const userProfie = await Profile.findOne({ userID: new mongoose.Types.ObjectId(loggedInUser._id) })
    // console.log(userProfie)
    // if (!userProfie) {
    //   const newProfile = new Profile({
    //     userID: loggedInUser._id,
    //   });
    // }
    // if(userProfie.gender === null || userProfie.lookingFor === null || userProfie.location === '' || userProfie.dob === null || userProfie.relationshipPreference === null || userProfie.bio === '')
    //   return res.json(new ApiResponse(409, null, 'Complete your profile setup first!'))

    return res
      .status(200)
      .cookie("refreshToken", refreshToken, options)
      .cookie("accessToken", accessToken, options)
      .json(new ApiResponse(200, loggedInUser, "User logged in successfully"));
  } catch (err) {
    return handleErr(res, err);
  }
};

const register = async (req, res) => {

  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.json(new ApiResponse(410, "All fields are required!"));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json(new ApiResponse(409, "User already exists!"));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const userHash = crypto.createHash('md5').update(email).digest('hex');
    const profileHash = crypto.createHash('md5').update(email + 'profile').digest('hex');

    const amorrID = uuidv4();

    const existingAmorrID = await User.findOne({ amorrID });
    if (existingAmorrID) {
      return res.json(new ApiResponse(409, "Generated amorrID already exists, try again."));
    }

    // user
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      amorrID,
      userHash
    });
    console.log(newUser);
    const newProfile = await Profile.create({
      userID: newUser._id,
      profileHash: profileHash,
      amorrID: amorrID,
      userName: username,
      profilePic: "",
      bio: "",
      gender: null,
      lookingFor: null,
      location: {
        latitude: "",
        longitude: ""
      },
      dob: null,
      height: "",
      relationshipPreference: null,
      likes: []
    });

    newUser.profileID = newProfile._id;
    await newUser.save();

    console.log("New User and Profile Created:", newUser, newProfile);
    return res.json(
      new ApiResponse(201, { user: newUser, profile: newProfile }, "User and Profile registered successfully!")
    );
  } catch (err) {
    return handleErr(res, err);
  }
};

const sendForgetPasswordMail = async (req, res) => {
  try {
    const { userID } = req.body;
    if (!userID) return res.json(new ApiResponse(400, null, 'UserID not provided.'));
    if (!process.env.AUTH_EMAIL) return res.json(new ApiError(400, 'AUTH EMAIL cannot be undefined.'));

    const user = await User.findById(userID);
    if (!user) return res.json(new ApiResponse(404, null, 'user not found.'));

    const resetPasswordToken = uuidv4();

    // expires after 15 min
    const date = new Date();
    const expDate = new Date(date.getTime() + 15 * 60000);

    const updatedUser = await User.findByIdAndUpdate(userID, {
      $set: {
        resetPasswordToken,
        resetPasswordExpires: expDate
      }
    }, { new: true });

    if (!updatedUser) return res.json(new ApiResponse(400, null, 'unable to create reset password token.'));

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetPasswordToken}`

    const mailOptions = {
      from: {
        name: "Amorr",
        address: process.env.AUTH_EMAIL,
      },
      to: user.email,
      subject: 'Password Reset Email.',
      html: `<p>You requested for a password reset. Click <a href="${resetUrl}">here</a> to reset your password. This link is valid for 15 minute.`
    }

    await transporter.sendMail(mailOptions);

    return res.json(new ApiResponse(200, null, 'mail sent successfully.'));

  }
  catch (err) {
    return handleErr(res, err);
  }
}

const forgetPassword = async (req, res) => {
  try {

    const { password, newPassword } = req.body;

    const { token } = req.params;

    const user = await User.findOne({ resetPasswordToken: token });

    if (!user) return res.json(new ApiResponse(401, null, 'Unauthorized! Invalid Token!'));

    if (user.resetPasswordExpires < Date.now()) {
      return res.json(new ApiResponse(403, null, 'Token expired.'));
    }



    const passwordCheck = await bcrypt.compare(user.password, password);

    if (!passwordCheck) return res.json(new ApiResponse(401, null, 'invalid password'));

    const newHashedPassword = await bcrypt.hash(newPassword, 12);

    const updatedUser = await User.findByIdAndUpdate(userID, { $set: { password: newHashedPassword } });

    return res.json(new ApiResponse(200, updatedUser, 'Password changed successfully.'));

  }
  catch (err) {
    return handleErr(res, err);
  }
}

const getUserById = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.json(new ApiResponse(400, null, 'UserID not provided.'));
    }

    const user = await User.findById({_id: userId});

    if (!user) {
      return res.json(new ApiResponse(404, null, 'User not found.'));
    }

    return res.json(new ApiResponse(200, user, 'User fetched successfully.'));
  } catch (err) {
    return handleErr(res, err);
  }
};


export {
  loginUser,
  register,
  sendEmailOtp,
  verifyEmailOtp,
  forgetPassword,
  sendForgetPasswordMail,
  getUserById
}