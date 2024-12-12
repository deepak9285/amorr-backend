import mongoose from "mongoose";

const { Schema } = mongoose;

const UserPreferencesSchema = new mongoose.Schema(
  {
    userID: { type: Schema.Types.ObjectId, ref: 'User' },
    preferredGender: { type: String },
    ageRange: {
      min: { type: Number },
      max: { type: Number }
    },
    relationshipPreference: {
      type: String,
      enum: [
        "Life Long partner",
        "Long Term Relationship",
        "Short Term Relationship",
        "Friendship & Connection",
        "Situationship",
        "Something casual",
      ],
      required: true
    },
    // location: {
    //   latitude: { type: Number, required: false, min: -90, max: 90 },
    //   longitude: { type: Number, required: false, min: -180, max: 180 },
    // },
  },
  {
    timestamps: true,
  }
);

const UserPreferences = mongoose.model('UserPreferences', UserPreferencesSchema);

export { UserPreferences };
