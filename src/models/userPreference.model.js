import mongoose from "mongoose";

const { Schema } = mongoose;

const UserPreferencesSchema = new mongoose.Schema(
  {
    userID: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    preferredGender: {
      type: String
    },
    ageRange: {
      min: { type: Number },
      max: { type: Number }
    },
    relationshipPreference: {
      type: String,
      enum: ['Life Long partner', 'Long Term Relationship', 'Short Term Relationship', 'Friship & Connection', 'Situationship', 'Something casual'],
      required: true
    },
    location: {
      type: String
    }
  }
);

const UserPreferences = mongoose.model('UserPreferences', UserPreferencesSchema);

export { UserPreferences };
