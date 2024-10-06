import { Profile } from "../models/profile.model.js";
import { User } from "../models/user.model.js";
import { handleErr } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

const updateProfile = async(req,res)=>{
  try{
    const {
      userID,
      profilePic,
      bio,
      gender,
      dob,
      height,
      relationshipPreference
    } = req.body;
    const profile = await Profile.findOne({userID});

    if(!profile) return res.json(new ApiResponse(404, null, 'User not found.'));

    const updatedProfile = await Profile.findOneAndUpdate({userID}, {$set:{
      profilePic:profilePic||profile.profilePic,
      bio:bio||profile.bio,
      gender:gender || profile.gender,
      dob:dob || profile.dob,
      height:height || profile.height,
      relationshipPreference:relationshipPreference || profile.relationshipPreference
    }});

    if(!updatedProfile) return res.json(new ApiResponse(500, null, "Unable to update profile , due to unexpected error."));


    return res.json(new ApiResponse(200, updatedProfile, 'Profile updated'));

  }
  catch(err){
    return handleErr(res,err);
  }
}

export {updateProfile}