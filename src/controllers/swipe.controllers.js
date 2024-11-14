import mongoose from "mongoose";
import { Profile } from "../models/profile.model.js";
import { ApiResponse } from "../utils/apiResponse.js";

// const swipe = async (req, res) => {
//     const { profileID, targetUserId, action } = req.body;

//     if (!profileID || !targetUserId || !['like', 'dislike'].includes(action)) {
//         return res.json(new ApiResponse(404, null, 'Invalid request'));
//     }
//     if (profileID === targetUserId) {
//         return res.json(new ApiResponse(400, null, 'You cannot swipe on yourself'));
//     }

//     try {
//         const targetUser = await Profile.findById({ _id: new mongoose.Types.ObjectId(targetUserId) });
//         const user = await Profile.findById(profileID);

//         if (!user) {
//             return res.status(404).json(new ApiResponse(404, null, 'User not found'));
//         }
//         if (!targetUser) {
//             return res.status(404).json(new ApiResponse(404, null, 'Target user not found'));
//         }

//         // Check if a match already exists
//         const existingMatchForUser = user.matches.find(
//             match => match.senderID.equals(targetUserId) && match.recieverID.equals(profileID)
//         );

//         const existingMatchForTargetUser = targetUser.matches.find(
//             match => match.senderID.equals(targetUserId) && match.recieverID.equals(profileID)
//         );

//         if (existingMatchForUser || existingMatchForTargetUser) {
//             if (existingMatchForUser) {
//                 console.log("existingMatchForUser")
//                 existingMatchForUser.status = 'accepted';
//                 existingMatchForTargetUser.status = 'accepted';
//             }
            
//             if (existingMatchForTargetUser) {
//                 console.log("existingMatchForTargetUser")
//                 existingMatchForUser.status = 'accepted';
//                 existingMatchForTargetUser.status = 'accepted';
//             }

//             user.markModified('matches');
//             targetUser.markModified('matches');

//             await user.save();
//             await targetUser.save();

//             return res.json(new ApiResponse(200, {message: "matched"}, 'Match accepted'));
//         } else {
//             // Create a match request with `pending` status for both profiles

//             // Record the action (like or dislike) for the swipe in the initiating user's profile
//             user.matches.push({
//                 senderID: profileID,
//                 recieverID: targetUserId,
//                 status: 'pending',
//             });

//             targetUser.matches.push({
//                 senderID: profileID,
//                 recieverID: targetUserId,
//                 status: 'pending',
//             });

//             user.markModified('matches');
//             targetUser.markModified('matches');

//             await user.save();
//             await targetUser.save();

//             if (action === 'like' && !user.likes.includes(targetUserId)) {
//                 user.likes.push(targetUserId);
//             } else if (action === 'dislike' && !user.dislikes.includes(targetUserId)) {
//                 user.dislikes.push(targetUserId);
//             }

//             user.markModified('likes');
//             user.markModified('dislikes');
//             await user.save();

//             return res.json(new ApiResponse(200, user, 'Swipe recorded, match requests created with pending status.'));
//         }
//     } catch (error) {
//         console.error("Error in swipe API:", error);
//         return res.json(new ApiResponse(500, error.message || error, 'Server error'));
//     }
// };


const swipe = async (req, res) => {
    const { profileID, targetUserId, action } = req.body;

    if (!profileID || !targetUserId || !['like', 'dislike'].includes(action)) {
        return res.json(new ApiResponse(404, null, 'Invalid request'));
    }
    if (profileID === targetUserId) {
        return res.json(new ApiResponse(400, null, 'You cannot swipe on yourself'));
    }

    try {
        const user = await Profile.findById(profileID);
        const targetUser = await Profile.findById(targetUserId);

        if (!user) {
            return res.status(404).json(new ApiResponse(404, null, 'User not found'));
        }
        if (!targetUser) {
            return res.status(404).json(new ApiResponse(404, null, 'Target user not found'));
        }

        // Check if a match already exists in both profiles
        const userMatchIndex = user.matches.findIndex(match => match.recieverID.equals(targetUserId));
        const targetUserMatchIndex = targetUser.matches.findIndex(match => match.recieverID.equals(profileID) );

        if (userMatchIndex !== -1 && targetUserMatchIndex !== -1) {
            // Update status to 'accepted' in both profiles
            user.matches[userMatchIndex].status = 'accepted';
            targetUser.matches[targetUserMatchIndex].status = 'accepted';

            user.markModified('matches');
            targetUser.markModified('matches');

            await user.save();
            await targetUser.save();

            return res.json(new ApiResponse(200, { message: "matched" }, 'Match accepted'));
        } else {
            // Create a match request with `pending` status for both profiles if not already existing
            if (userMatchIndex === -1) {
                user.matches.push({
                    senderID: profileID,
                    recieverID: targetUserId,
                    status: 'pending',
                });
            }

            if (targetUserMatchIndex === -1) {
                targetUser.matches.push({
                    senderID: targetUserId,
                    recieverID: profileID,
                    status: 'pending',
                });
            }

            user.markModified('matches');
            targetUser.markModified('matches');

            await user.save();
            await targetUser.save();

            // Record the action (like or dislike) for the swipe in the initiating user's profile
            if (action === 'like' && !user.likes.includes(targetUserId)) {
                user.likes.push(targetUserId);
            } else if (action === 'dislike' && !user.dislikes.includes(targetUserId)) {
                user.dislikes.push(targetUserId);
            }

            user.markModified('likes');
            user.markModified('dislikes');
            await user.save();

            return res.json(new ApiResponse(200, user, 'Swipe recorded, match requests created with pending status.'));
        }
    } catch (error) {
        console.error("Error in swipe API:", error);
        return res.json(new ApiResponse(500, error.message || error, 'Server error'));
    }
};


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
        return res.status(400).json(new ApiResponse(400, null, 'Invalid status'));
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
        } else {
            return res.status(404).json({ message: 'Match not found for user' });
        }

        const targetUserMatch = targetUser.matches.find(
            match => match.senderID.equals(targetUserId) && match.recieverID.equals(profileId)
        );

        if (targetUserMatch) {
            targetUserMatch.status = newStatus;
            await targetUser.save();
        } else {
            return res.status(404).json({ message: 'Match not found for target user' });
        }

        return res.json(new ApiResponse(200, null, `Match status updated to ${newStatus}`));
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json(new ApiResponse(500, error.message, 'Server error'));
    }
};


export { swipe, updateMatchStatus, getMatchesByStatus };
