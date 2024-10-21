import mongoose from "mongoose";

const {Schema} = mongoose;

const SwipeSchema = new mongoose.Schema({
    userId: String,
    targetUserId: String,
    action: String, // 'like' or 'dislike'
    timestamp: { type: Date, default: Date.now }
});

const Swipe = mongoose.model('Swipe', SwipeSchema);

export {Swipe};

