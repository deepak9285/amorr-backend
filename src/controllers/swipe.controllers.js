import mongoose from "mongoose";
import { Profile } from "../models/profile.model.js"
import { ApiResponse } from "../utils/apiResponse.js";
const swipe = async (req, res) => {
    const { profileId, targetUserId, action } = req.body;

    if (!profileId || !targetUserId || !['like', 'dislike'].includes(action)) {
        return res.json(new ApiResponse(404, null, 'invalid request'));
    }
    const targetUser = await Profile.findById({_id: new mongoose.Types.ObjectId(targetUserId)});
    const user = await Profile.findById(profileId);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    if (!targetUser) {
        return res.status(404).json({ message: 'targetUser not found' });
    }

    try {

        if (action === 'like') {

            if (!user.likes.includes(targetUserId))
                user.likes.push(targetUserId);

            const likeExists = targetUser.likes.includes(profileId);

            if (likeExists) {
               //saving the matches
                 const newMatch = new Match({ userId1: profileId, userId2: targetUserId });
                 await newMatch.save();

                if (!user.matches.includes(targetUserId))
                    user.matches.push(targetUserId);
                await user.save();

                if (!targetUser.matches.includes(profileId))
                    targetUser.matches.push(profileId);
                await targetUser.save();

                return res.json(new ApiResponse(200, user, 'Its a match!'));
            }
            else {
                //saving the likes
                if (!user.likes.includes(targetUserId))
                    user.likes.push(targetUserId);
                    await user.save();
            }
        }
        else{
            if (!user.dislikes.includes(targetUserId))
            user.dislikes.push(targetUserId);
            await user.save();
        }
        return res.json(new ApiResponse(200, user, 'Swipe Recorded, no match!'));
    }
    catch (error) {
        return res.json(new ApiResponse(500, error, 'Server error'));
    }
}

export { swipe }