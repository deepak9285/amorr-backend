import mongoose from "mongoose";

const { Schema } = mongoose;

const UserPreferencesSchema = new mongoose.Schema({
  userID: { type: Schema.Types.ObjectId, ref: 'User' },
  preferredGender: { type: String },
  ageRange: {
    min: { type: Number },
    max: { type: Number }
  },
  location: {
    type: String
  }
});

const UserPreferences = mongoose.model('UserPreferences', UserPreferencesSchema);

export { UserPreferences };
