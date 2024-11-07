import {Match} from "../models/Match.model.js"
import { User } from "../models/user.model.js"
import { ApiResponse } from "../utils/apiResponse.js";
const swipe = async(req,res) =>{
    const { userId, targetUserId, action } = req.body;

    if (!userId || !targetUserId || !["like", 'dislike'].includes(action)) {
        return res.json(new ApiResponse(404, null, 'invalid request'));
    }
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    try {
        if (action === "like") {
            const likeExists =  user.likes.includes(targetUserId);
            if (likeExists) {
                const newMatch = new Match({ userId1: userId, userId2: targetUserId });
                await newMatch.save();
                return res.json(new ApiResponse(200, null, 'Its a match!'));
            }
            else{
                user.likes.push(targetUserId);
                await user.save();
            }
        }

        return res.json(new ApiResponse(200, User, 'Swipe Recorded, no match!'));
    }
    catch (error) {
        return res.json(new ApiResponse(500, null, 'Server error'));
    }
}

export {swipe}
