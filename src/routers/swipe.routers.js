import { Router } from "express";
import { swipe } from "../controllers/swipe.controllers.js";

const router = Router();

router.route("/swipe").post(swipe);

export default router;

// import express from "express";
// import {Swipe} from '../models/Swipe.model.js'
// import {Match} from '../models/Match.model.js'


// const router = express.Router();

// router.post('/swipe', async (req, res) => {
//     const { userId, targetUserId, action } = req.body;

//     if (!userId || !targetUserId || !['like', 'dislike'].includes(action)) {
//         return res.status(400).json({ message: 'Invalid request' });
//     }

//     try {
//         // Record the swipe in the Swipe collection
//         const newSwipe = new Swipe({ userId, targetUserId, action });
//         await newSwipe.save();

//         if (action === 'like') {
//             // Check if the target user also liked the current user
//             const matchFound = await Swipe.findOne({
//                 userId: targetUserId,
//                 targetUserId: userId,
//                 action: 'like'
//             });

//             if (matchFound) {
//                 // A match is made - save it to the Match collection
//                 const newMatch = new Match({ userId1: userId, userId2: targetUserId });
//                 await newMatch.save();

//                 return res.status(200).json({ match: true, message: "It's a match!" });
//             }
//         }

//         return res.status(200).json({ match: false, message: 'Swipe recorded.' });
//     } catch (error) {
//         console.error('Error processing swipe:', error);
//         return res.status(500).json({ message: 'Server error' });
//     }
// });

// export { router as SwipeRouter };