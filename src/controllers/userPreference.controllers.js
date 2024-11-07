import { UserPreferences } from '../models/userPreference.model.js';
import { asyncHandler } from "../utils/asyncHandler.js";

const createUserPreference = asyncHandler(async (req, res) => {
    const { userID, preferredGender, ageRange, relationshipPreference, location } = req.body;

    const newPreference = new UserPreferences({
        userID,
        preferredGender,
        ageRange,
        relationshipPreference,
        location
    });

    const savedPreference = await newPreference.save();
    return res.status(201).json(savedPreference);
});

const getUserPreference = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userPreference = await UserPreferences.findOne({ userID: id })
        .populate({
            path: 'userID',
            select: 'username email',
        })
        .select('preferredGender ageRange relationshipPreference location');;

    if (!userPreference) {
        return res.status(404).json({ error: 'User preference not found' });
    }

    return res.status(200).json(userPreference);

});

const updateUserPreference = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { preferredGender, ageRange, relationshipPreference, location } = req.body;

    const updatedPreference = await UserPreferences.findByIdAndUpdate(
        id,
        { preferredGender, ageRange, relationshipPreference, location },
        { new: true }
    );

    if (!updatedPreference) {
        return res.status(404).json({ error: 'User preference not found' });
    }

    return res.status(200).json(updatedPreference);

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
