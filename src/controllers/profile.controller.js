import mongoose from "mongoose";
import { Profile } from "../models/profile.model.js";
import { User } from "../models/user.model.js";
import { UserPreferences } from "../models/userPreference.model.js";
import { handleErr } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { calculateProfileSimilarity } from "../utils/matchAlgo.js";
// const tf = require('@tensorflow/tfjs');
// const use = require('@tensorflow-models/universal-sentence-encoder');
import { Match } from "../models/Match.model.js";

const updateProfile = async (req, res) => {
  try {
    const {
      username,
      userID,
      profilePic,
      bio,
      gender,
      dob,
      lookingFor,
      height,
      location,
      relationshipPreference,
      userPhotos,
    } = req.body;
    const profile = await User.findById(new mongoose.Types.ObjectId(userID));
    console.log("sdfsdf");
    if (!profile) return res.json(new ApiResponse(404, null, 'User not found.'));
    const updatedProfile = await Profile.findOneAndUpdate({ userID }, {
      $set: {
        username:username||profile.name,
        profilePic: profilePic || profile.profilePic,
        bio: bio || profile.bio,
        gender: gender || profile.gender,
        lookingFor: lookingFor || profile.lookingFor,
        location: location || profile.location,
        dob: dob || profile.dob,
        height: height || profile.height,
        relationshipPreference: relationshipPreference || profile.relationshipPreference,
        userPhotos: userPhotos || profile.userPhotos,
      }
    });
    if (!updatedProfile) return res.json(new ApiResponse(500, null, "Unable to update profile , due to unexpected error."));
    return res.json(new ApiResponse(200, updatedProfile, 'Profile updated'));
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
    const { userID, profileID } = req.body;  // profileID: profile to be liked and userID: user which is liking the profile.
    if (!userID || !profileID) return res.json(new ApiResponse(400, null, 'userID or profileID not provided.'))

    const profile = await Profile.findById(profileID);
    const user = await User.findById(userID);

    if (!user || !profile) return res.json(new ApiResponse(404, null, 'Data not found.'));

    const updatedProfile = await Profile.findByIdAndUpdate(profileID, { $pull: { likes: { userID } } }, { new: true });

    if (!updatedProfile) return res.json(new ApiResponse(500, 'unable to dislike the profile.'));

    return res.json(new ApiResponse(200, updatedProfile, 'profile disliked'));

  }
  catch (err) {
    return handleErr(res, err);
  }
}

const calculateProfileCompleteness = async (req, res) => {
  try {
    const { userID } = req.body;
    if (!userID) return res.json(new ApiResponse(400, null, 'User ID not provided.'));

    const profile = await Profile.findOne({ userID });
    if (!profile) return res.json(new ApiResponse(404, null, 'Profile not found.'));

    let completeness = 0;
    const totalCriteria = 10;

    if (profile.profilePic) completeness += 1;
    if (profile.bio) completeness += 1;
    if (profile.gender) completeness += 1;
    if (profile.dob) completeness += 1;
    if (profile.lookingFor) completeness += 1;
    if (profile.height) completeness += 1;
    if (profile.location) completeness += 1;
    if (profile.relationshipPreference) completeness += 1;
    if (profile.userPhotos && profile.userPhotos.length > 0) completeness += 1;
    if (profile.promptsAnswers && profile.promptsAnswers.length > 0 && profile.promptsAnswers.length <= 3) completeness += 1;

    const compPer = (completeness / totalCriteria) * 100;

    profile.completeness = compPer;
    await profile.save();

    return res.json(new ApiResponse(200, { completeness: compPer }, 'Profile completeness calculated and updated successfully.'));
  } catch (err) {
    return handleErr(res, err);
  }
};

const fetch_by_preferences = async (req, res) => {
  try {
    const { userID } = req.body;
    if (!userID) return res.json(new ApiResponse(400, null, 'User id not provided.'));

    const user = await UserPreferences.findOne({ userID: new mongoose.Types.ObjectId(userID) });
    if (!user) return res.json(new ApiResponse(404, null, 'User not found.'));

    console.log('User found:', user);

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
        { relationshipPreference: { $regex: user.relationshipPreference, $options: 'i' } }
      ]
    }).populate('user');

    console.log('Matching users found:', result);

    if (!result || result.length === 0) return res.json(new ApiResponse(404, null, 'No user found.'));

    const scoredMatches = await Promise.all(
      result.map(async match => {
        try {
          const score = await calculateProfileSimilarity(user, match);
          return { match, score };
        } catch (error) {
          console.error('Error calculating similarity:', error);
          return null; // Skip this match if there's an error
        }
      })
    );

    // Filter out any null results caused by errors in calculateProfileSimilarity
    const validMatches = scoredMatches.filter(item => item !== null);

    // Sort by score in descending order
    validMatches.sort((a, b) => b.score - a.score);

    //saving scores in db 
    user.preferredProfiles = validMatches;
    await user.save();

    // Return both match and score in the response
    if (!validMatches || validMatches.length === 0)
      return res.json(new ApiResponse(404, null, 'No user found'));

    return res.json(new ApiResponse(200, user.preferredProfiles, 'Preference match users fetched successfully'));
  }
  catch (err) {
    console.error('Error in fetch_by_preferences:', err);
    return handleErr(res, err);
  }
};



const fetch_by_id = async (req, res) => {
  try {
    const { profileID } = req.body;
    if (!profileID) return res.json(new ApiResponse(400, null, 'User id not provided.'));

    const profile = await Profile.findById({ _id: new mongoose.Types.ObjectId(profileID) });
    if (!profile) return res.json(new ApiResponse(404, null, 'profile not found.'));

    return res.json(new ApiResponse(200, profile, 'profile fetched successfully.'));
  }
  catch (err) {
    return handleErr(res, err);
  }
}

export {
  updateProfile,
  fetch_by_preferences,
  // fetchProfilebyId,
  like_profile,
  dislike_profile,
  calculateProfileCompleteness,
  fetch_by_id
}