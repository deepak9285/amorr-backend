// import mongoose from "mongoose";
// import { Profile } from "../models/profile.model.js"
// import { ApiResponse } from "../utils/apiResponse.js";
// const swipe = async (req, res) => {
//     const { profileId, targetUserId, action } = req.body;

//     if (!profileId || !targetUserId || !['like', 'dislike'].includes(action)) {
//         return res.json(new ApiResponse(404, null, 'invalid request'));
//     }
//     const targetUser = await Profile.findById({ _id: new mongoose.Types.ObjectId(targetUserId) });
//     const user = await Profile.findById(profileId);

//     if (!user) {
//         return res.status(404).json({ message: 'User not found' });
//     }
//     if (!targetUser) {
//         return res.status(404).json({ message: 'targetUser not found' });
//     }

//     try {

//         if (action === 'like') {

//             if (!user.likes.includes(targetUserId))
//                 user.likes.push(targetUserId);

//             const likeExists = targetUser.likes.includes(profileId);

//             if (likeExists) {
//                 //saving the matches
//                 const newMatch = new Match({ userId1: profileId, userId2: targetUserId });
//                 await newMatch.save();

//                 if (!user.matches.includes(targetUserId))
//                     user.matches.push(targetUserId);
//                 await user.save();

//                 if (!targetUser.matches.includes(profileId))
//                     targetUser.matches.push(profileId);
//                 await targetUser.save();

//                 return res.json(new ApiResponse(200, user, 'Its a match!'));
//             }
//             else {
//                 //saving the likes
//                 if (!user.likes.includes(targetUserId))
//                     user.likes.push(targetUserId);
//                 await user.save();
//             }
//         }
//         else {
//             if (!user.dislikes.includes(targetUserId))
//                 user.dislikes.push(targetUserId);
//             await user.save();
//         }
//         return res.json(new ApiResponse(200, user, 'Swipe Recorded, no match!'));
//     }
//     catch (error) {
//         return res.json(new ApiResponse(500, error, 'Server error'));
//     }
// }

// export { swipe }


import mongoose from "mongoose";
import { Profile } from "../models/profile.model.js";
import { ApiResponse } from "../utils/apiResponse.js";

const swipe = async (req, res) => {
    const { profileId, targetUserId, action } = req.body;

    if (!profileId || !targetUserId || !['like', 'dislike'].includes(action)) {
        return res.json(new ApiResponse(404, null, 'Invalid request'));
    }
    if (profileId === targetUserId) {
        return res.json(new ApiResponse(400, null, 'You cannot swipe on yourself'));
    }

    const targetUser = await Profile.findById({ _id: new mongoose.Types.ObjectId(targetUserId) });
    const user = await Profile.findById(profileId);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    if (!targetUser) {
        return res.status(404).json({ message: 'Target user not found' });
    }

    try {
        // Check if a match request already exists in `user.matches`
        const existingMatchForUser = user.matches.find(
            match => match.senderID.equals(profileId) && match.recieverID.equals(targetUserId)
        );

        const existingMatchForTargetUser = targetUser.matches.find(
            match => match.senderID.equals(targetUserId) && match.recieverID.equals(profileId)
        );

        // Create a match request with `pending` status for both profiles if it doesn’t exist
        if (!existingMatchForUser) {
            user.matches.push({
                senderID: profileId,
                recieverID: targetUserId,
                status: 'pending',
            });
            user.markModified('matches'); // Mark matches as modified
            await user.save();
        }

        if (!existingMatchForTargetUser) {
            targetUser.matches.push({
                senderID: targetUserId,
                recieverID: profileId,
                status: 'pending',
            });
            targetUser.markModified('matches'); // Mark matches as modified
            await targetUser.save();
        }

        // Record the action (like or dislike) for the swipe in the initiating user's profile
        if (action === 'like' && !user.likes.includes(targetUserId)) {
            user.likes.push(targetUserId);
        } else if (action === 'dislike' && !user.dislikes.includes(targetUserId)) {
            user.dislikes.push(targetUserId);
        }

        user.markModified('likes'); // Mark likes as modified if they were updated
        user.markModified('dislikes'); // Mark dislikes as modified if they were updated
        await user.save();

        return res.json(new ApiResponse(200, user, 'Swipe recorded, match requests created with pending status.'));
    } catch (error) {
        // Log the error for troubleshooting
        console.error("Error in swipe API:", error);
        return res.json(new ApiResponse(500, error.message || error, 'Server error'));
    }
};

// const getMatchesByStatus = async (req, res) => {
//     const { profileId, status } = req.body;
//     if (!['accepted', 'pending', 'rejected'].includes(status)) {
//         return res.json(new ApiResponse(400, null, 'Invalid status'));
//     }

//     try {
//         const user = await Profile.findById(profileId);

//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }
//         const matches = user.matches.filter(match => match.status === status);

//         return res.json(new ApiResponse(200, matches, 'Matches fetched successfully'));
//     } catch (error) {
//         return res.json(new ApiResponse(500, error, 'Server error'));
//     }
// };

const getMatchesByStatus = async (req, res) => {
    const { profileId, status } = req.body;
    
    if (!['accepted', 'pending', 'rejected'].includes(status)) {
        return res.status(400).json(new ApiResponse(400, null, 'Invalid status'));
    }

    try {
        const user = await Profile.findById(profileId);

        if (!user) {
            return res.status(404).json(new ApiResponse(404, null, 'User not found'));
        }
        const matches = user.matches.filter(match => match.status === status);
        return res.status(200).json(new ApiResponse(200, matches, 'Matches fetched successfully'));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, error, 'Server error'));
    }
};



const updateMatchStatus = async (req, res) => {
    const { profileId, targetUserId, newStatus } = req.body;
    if (!['accepted', 'pending', 'rejected'].includes(newStatus)) {
        return res.json(new ApiResponse(400, null, 'Invalid status'));
    }

    try {
        const user = await Profile.findById(profileId);
        const targetUser = await Profile.findById(targetUserId);

        if (!user || !targetUser) {
            return res.status(404).json({ message: 'User or target user not found' });
        }
        const userMatch = user.matches.find(
            match => match.senderID.equals(profileId) && match.recieverID.equals(targetUserId)
        );

        if (userMatch) {
            userMatch.status = newStatus;
            await user.save();
        }
        const targetUserMatch = targetUser.matches.find(
            match => match.senderID.equals(targetUserId) && match.recieverID.equals(profileId)
        );

        if (targetUserMatch) {
            targetUserMatch.status = newStatus;
            await targetUser.save();
        }

        return res.json(new ApiResponse(200, null, `Match status updated to ${newStatus}`));
    } catch (error) {
        return res.json(new ApiResponse(500, error, 'Server error'));
    }
};

export { swipe, updateMatchStatus, getMatchesByStatus };
