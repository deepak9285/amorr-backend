import mongoose from "mongoose";

const {Schema} = mongoose;


const MilestoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  reward: { type: Schema.Types.ObjectId, ref: 'Reward' }, 
},
{
  timestamps:true
});

const Milestone = mongoose.model('Milestone', MilestoneSchema);
export {Milestone};
