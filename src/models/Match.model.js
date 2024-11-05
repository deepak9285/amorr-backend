import mongoose from "mongoose";

const MatchSchema = new mongoose.Schema({
    userId1: String,
    userId2: String,
    timestamp: { type: Date, default: Date.now }
});
const Match = mongoose.model('Match', MatchSchema);
export {Match}


