import mongoose from "mongoose";
import { handleErr } from "../utils/apiError.js";
import {
  uploadObject,
  deleteObject,
  uploadFile,
  getObjectUrl,
} from "../utils/aws";
import { ApiResponse } from "../utils/apiResponse.js";
import { Profile } from "../models/profile.model.js";
const UploadObject = async (req, res) => {
  const { profilePic, coverPic, userPhotos, userID } = req.body;
  try {
    const uploadImage = async (file, folder) => {
      const fileName = `${folder}-${Date.now()}`;
      const folderName = folder;
      const contentType = "image/jpeg";
      const data = await uploadObject(fileName, folderName, contentType);
      if (data.error) throw new Error(`Failed to upload ${folder}`);
      return data.url;
    };
    const payload = {};
    if (profilePic) {
      const profilePicUrl = await uploadImage(profilePic, "ProfileImages");
      payload.profilePic = profilePicUrl;
    }
    if (coverPic) {
      const coverPicUrl = await uploadImage(coverPic, "CoverImages");
      payload.coverPic = coverPicUrl;
    }

    if (userPhotos && userPhotos.length > 0) {
      const userPhotosUrls = await Promise.all(
        userPhotos.map(async (photo) => ({
          label: photo.label,
          url: await uploadImage(photo.url, "UserPhotos"),
        }))
      );
      payload.userPhotos = userPhotosUrls;
    }

    const updatedProfile = await Profile.findOneAndUpdate({ userID }, payload, {
      new: true,
      upsert: true,
    });
    return ApiResponse(res, 200, "Profile updated successfully.");
  } catch (error) {
    console.error(error);
    handleErr(res, "Failed to upload images or update profile.");
  }
};
export { UploadObject };
