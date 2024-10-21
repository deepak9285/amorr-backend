import { Swipe } from "../models/Swipe.model";
import {Match} from "../models/Match.model"

const swipe = async(req,res) =>{
    const { userId, targetUserId, action } = req.body;

    if (!userId || !targetUserId || !['like', 'dislike'].includes(action)) {
        return res.json(new ApiResponse(404, null, 'invalid request'));
    }

    try {
        const newSwipe = new Swipe({ userId, targetUserId, action });
        await newSwipe.save();

        if (action === 'like') {
            const matchFound = await Swipe.findOne({
                userId: targetUserId,
                targetUserId: userId,
                action: 'like'
            });

            if (matchFound) {
                const newMatch = new Match({ userId1: userId, userId2: targetUserId });
                await newMatch.save();

                return res.json(new ApiResponse(200, null, 'Its a match!'));
            }
        }

        return res.json(new ApiResponse(200, null, 'Swipe Recorded, no match!'));
    }
    catch (error) {
        return res.json(new ApiResponse(500, null, 'Server error'));
    }
}

export {swipe}
