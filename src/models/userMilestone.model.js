import mongoose from "mongoose";

const UserMilestoneSchema = new mongoose.Schema({
  milestoneID: { type: Schema.Types.ObjectId, ref: 'Milestone' },
  status: { type: String },
  userID: { type: Schema.Types.ObjectId, ref: 'User' },
  progress: { type: Number },
  completed: { type: Boolean, default: false },
  rewardGranted: { type: Boolean, default: false }
});

const UserMilestone = mongoose.model('UserMilestone', UserMilestoneSchema);
export {UserMilestone};
