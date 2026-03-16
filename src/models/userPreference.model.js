import mongoose from "mongoose";

const { Schema } = mongoose;

const UserPreferencesSchema = new mongoose.Schema(
  {
    userID: { type: Schema.Types.ObjectId, ref: 'User' },
    verified: { type: Boolean, default: false },
    preferredGender: { type: String },
    ageRange: {
      min: { type: Number, default: 18 },
      max: { type: Number, default: 25 },
    },
    relationshipPreference: {
      type: String,
      enum: [
        "Life Long partner",
        "Long Term Relationship",
        "Short Term Relationship",
        "Friendship & Connection",
        "Situationship",
        "Something Casual",
      ],
      required: true
    },
    language: { type: String, default: "English", required: false },
    distance: { type: Number, default: 10, required: false },
    specInterests: [
      {
        code: String,
        title: String,
        answer: String,
      },
    ],
    exceedDistance: { type: Boolean, default: false },
    exceedAge: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

const UserPreferences = mongoose.model('UserPreferences', UserPreferencesSchema);

export { UserPreferences };
