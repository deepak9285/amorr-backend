import mongoose from "mongoose";
import { Profile } from "../models/profile.model.js";
import { User } from "../models/user.model.js";
import { UserPreferences } from "../models/userPreference.model.js";
import { handleErr } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
const updateProfile = async (req, res) => {
  try {
    const {
      userID,
      profilePic,
      bio,
      gender, 
      dob,
      lookingFor,
      height,
      location,
      relationshipPreference,
    } = req.body;
    const profile = await User.findById(new mongoose.Types.ObjectId(userID));
    if (!profile) return res.json(new ApiResponse(404, null, 'User not found.'));
    const updatedProfile = await Profile.findOneAndUpdate({ userID }, {
      $set: {
        profilePic: profilePic || profile.profilePic,
        bio: bio || profile.bio,
        gender: gender || profile.gender,
        lookingFor: lookingFor || profile.lookingFor,
        location: location || profile.location,
        dob: dob || profile.dob,
        height: height || profile.height,
        relationshipPreference: relationshipPreference || profile.relationshipPreference
      }
    });
    if (!updatedProfile) return res.json(new ApiResponse(500, null, "Unable to update profile , due to unexpected error."));
    return res.json(new ApiResponse(200, updatedProfile, 'Profile updated'));
  }
  catch (err) {
    return handleErr(res, err);
  }
}


const fetch_by_preferences = async (req, res) => {
  try {

    const { userID } = req.body;
    if (!userID) return res.json(new ApiResponse(400, null, 'User id not provided.'));

    const user = await UserPreferences.findOne({ userID });
    if (!user) return res.json(new ApiResponse(404, null, 'user not found.'));

    console.log('log from fetch_by_preferences controller: ', user);

    const result = await UserPreferences.find({
      "$or": [
        { preferredGender: { $regex: user.preferredGender, $options: 'i' } },
        { location: { $regex: user.location, $options: 'i' } },
        {
          ageRange: {
            $gte: user.ageRange.min,
            $lte: user.ageRange.max
          }
        },
        { relationshipPreference: { $regex: user.relationshipPreference } }
      ]
    }).populate('userID');

    if (!result || result.length === 0) return res.json(new ApiResponse(404, null, 'no user found.'));

    return res.json(new ApiResponse(200, result, 'Users fetched successfully.'));

  }
  catch (err) {
    return handleErr(res, err);
  }
}

// done
const like_profile = async (req, res) => {
  try {

    const { userID, profileID } = req.body;  // profileID: profile to be liked and userID: user which is liking the profile.
    if (!userID || !profileID) return res.json(new ApiResponse(400, null, 'userID or profileID not provided.'))

    const profile = await Profile.findById(profileID);
    const user = await User.findById(userID);

    if (!user || !profile) return res.json(new ApiResponse(404, null, 'Data not found.'));

    const updatedProfile = await Profile.findByIdAndUpdate(profileID, { $push: { likes: { userID } } }, { new: true });

    if (!updatedProfile) return res.json(new ApiResponse(500, 'unable to like the profile.'));

    return res.json(new ApiResponse(200, updatedProfile, 'profile liked'));

  }
  catch (err) {
    return handleErr(res, err);
  }
}


const dislike_profile = async (req, res) => {
  try {

  }
  catch (err) {
    return handleErr(res, err);
  }
}



export {
  updateProfile,
  fetch_by_preferences,
  like_profile
}