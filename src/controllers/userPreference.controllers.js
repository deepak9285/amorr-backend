import mongoose from 'mongoose';
import { UserPreferences } from '../models/userPreference.model.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from "../utils/asyncHandler.js";

const createUserPreference = asyncHandler(async (req, res) => {
    const { userID, preferredGender, ageRange, relationshipPreference, location } = req.body;

    const newPreference = new UserPreferences({
        userID,
        preferredGender,
        ageRange,
        relationshipPreference,
        location,
    });

    const savedPreference = await newPreference.save();
    return res.status(201).json(savedPreference);
});

const getUserPreference = asyncHandler(async (req, res) => {
    const { userID } = req.body;
    const userPreference = await UserPreferences.findOne({ userID: new mongoose.Types.ObjectId(userID) })
        .populate({
            path: 'userID',
            select: 'username email profileID isAadharVerified',
        })
        .select('preferredGender ageRange relationshipPreference language distance specInterests exceeedDistance exceedAge verified');

    if (!userPreference) {
        return res.status(404).json({ error: 'User preference not found' });
    }

    // return res.status(200).json(userPreference);
    return res.json(
        new ApiResponse(200, userPreference, 'User Preference Fetched successfully')
    );

});

const updateUserPreference = asyncHandler(async (req, res) => {
    const { id, preferredGender, ageRange, relationshipPreference, location, distance, verified } = req.body;
    console.log("req.body", req.body);
   

    const updatedPref = await UserPreferences.findOne({ userID: new mongoose.Types.ObjectId(id) });
    console.log("User preference found:", updatedPref);
    if (!updatedPref) {
        return res.status(404).json({ error: 'User preference not found' });
    }

    const updatedPreference = await UserPreferences.findOneAndUpdate(
        { userID: new mongoose.Types.ObjectId(id) },
        { $set: { preferredGender, ageRange, relationshipPreference, location, distance, verified } },
        { new: true }
    );

    return res.json(
        new ApiResponse(200, null, 'Unable to update profile due to unexpected error.')
    );

});

const deleteUserPreference = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deletedPreference = await UserPreferences.findByIdAndDelete(id);

    if (!deletedPreference) {
        return res.status(404).json({ error: 'User preference not found' });
    }

    return res.status(200).json({ message: 'User preference deleted successfully' });
});

export {
    createUserPreference,
    getUserPreference,
    updateUserPreference,
    deleteUserPreference
}
