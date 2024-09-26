import mongoose from "mongoose";

const MilestoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  reward: { type: Schema.Types.ObjectId, ref: 'Reward' }, // Assuming there is a Reward schema
  timestamps: { type: Boolean, default: true }
});

const Milestone = mongoose.model('Milestone', MilestoneSchema);
export {Milestone};
