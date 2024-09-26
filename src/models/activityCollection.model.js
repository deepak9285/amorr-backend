import mongoose from "mongoose";

const ActivityCollectionSchema = new mongoose.Schema({
  userID: { type: Schema.Types.ObjectId, ref: 'User' },
  activity_type: { type: String, enum: ['game', 'search', 'like', 'comment'] },
  pointsEarned: { type: Number },
}, {
  timestamps:true
});

const ActivityCollection = mongoose.model('ActivityCollection', ActivityCollectionSchema);
export {ActivityCollection};
