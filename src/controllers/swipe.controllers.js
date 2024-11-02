import { Profile } from "../models/profile.model.js"
import { ApiResponse } from "../utils/apiResponse.js";
const swipe = async (req, res) => {
    const { profileId, targetUserId, action } = req.body;

    if (!profileId || !targetUserId || !['like', 'dislike'].includes(action)) {
        return res.json(new ApiResponse(404, null, 'invalid request'));
    }
    const targetUser = await Profile.findById(targetUserId);
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

            const likeExists = targetUser.likes.includes(userId);

            if (likeExists) {
                if (!user.matches.includes(targetUserId))
                    user.matches.push(targetUserId);
                await user.save();

                if (!targetUser.matches.includes(userId))
                    targetUser.matches.push(userId);
                await targetUser.save();

                return res.json(new ApiResponse(200, user, 'Its a match!'));
            }
            else {
                if (!user.likes.includes(targetUserId))
                    user.likes.push(targetUserId);
                await user.save();
            }
        }
        return res.json(new ApiResponse(200, user, 'Swipe Recorded, no match!'));
    }
    catch (error) {
        return res.json(new ApiResponse(500, error, 'Server error'));
    }
}

export { swipe }