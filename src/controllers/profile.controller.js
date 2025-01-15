import mongoose from "mongoose";
import { Profile } from "../models/profile.model.js";
import { User } from "../models/user.model.js";
import { UserPreferences } from "../models/userPreference.model.js";
import { handleErr } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { calculateProfileSimilarity } from "../utils/matchAlgo.js";
import { Match } from "../models/Match.model.js";

const updateProfile = async (req, res) => {
  try {
    const {
      username,
      userID,
      profilePic,
      bio,
      gender,
      dob,
      lookingFor,
      height,
      location,
      city,
      profession,
      relationshipPreference,
      userPhotos,
      specInterests,
      interests,
      promptsAnswers,
    } = req.body;

    console.log('Request body:', req.body);
    const user = await User.findById(new mongoose.Types.ObjectId(userID));
    if (!user) return res.json(new ApiResponse(404, null, 'User not found.'));

    const profile = await Profile.findById(user.profileID);
    if (!profile) return res.json(new ApiResponse(404, null, 'Profile not found.'));

    if (interests && (!Array.isArray(interests) || interests.length < 2)) {
      return res.json(
        new ApiResponse(400, null, 'Please provide at least two valid interests.')
      );
    }

    const updatedLocation = location?.latitude && location?.longitude
      ? {
        type: 'Point',
        coordinates: [
          parseFloat(location.longitude),
          parseFloat(location.latitude),
        ],
      }
      : profile.location;

    const updateData = {
      username: username || profile.username,
      profilePic: profilePic || profile.profilePic,
      bio: bio || profile.bio,
      gender: gender || profile.gender,
      lookingFor: lookingFor || profile.lookingFor,
      dob: dob || profile.dob,
      height: height || profile.height,
      relationshipPreference: relationshipPreference || profile.relationshipPreference,
      userPhotos: userPhotos || profile.userPhotos,
      specInterests: specInterests || profile.specInterests,
      interests: interests || profile.interests,
      promptsAnswers: promptsAnswers || profile.promptsAnswers,
      location: updatedLocation,
      city: city || profile.city,
      profession: profession || profile.professionse
    };

    const updatedProfile = await Profile.findByIdAndUpdate(
      profile._id,
      { $set: updateData },
      { new: true }
    );

    const updatedPref = await UserPreferences.findOneAndUpdate(
      { userID: userID },
      {
        $set: {
          specInterests: specInterests || profile.specInterests,
          interests: interests || profile.interests,
          promptsAnswers: promptsAnswers || profile.promptsAnswers,
          preferredGender: lookingFor || profile.lookingFor,
          ageRange: dob ? {
            min: new Date(dob).getFullYear() - 2,
            max: new Date(dob).getFullYear() + 2,
          } : {
            min: new Date(profile.dob).getFullYear() - 2,
            max: new Date(profile.dob).getFullYear() + 2,
          },
        },
      },
      { new: true }
    );

    if (!updatedProfile) {
      return res.json(
        new ApiResponse(500, null, 'Unable to update profile due to unexpected error.')
      );
    }

    return res.json(new ApiResponse(200, updatedProfile, 'Profile updated successfully.'));
  } catch (err) {
    console.error('Error updating profile:', err);
    return handleErr(res, err);
  }
};


// done
const like_profile = async (req, res) => {
  try {

    const { userID, profileID } = req.body;  // profileID: profile to be liked and userID: user which is liking the profile.
    if (!userID || !profileID) return res.json(new ApiResponse(400, null, 'userID or profileID not provided.'))

    const profile = await Profile.findById(profileID);
    const user = await User.findById(userID);
    // console.log('pro',profile,'user',user);

    if (!user || !profile) return res.json(new ApiResponse(404, null, 'Data not found.'));
    console.log('pro',profile,'user',user);
    const updatedProfile = await Profile.findByIdAndUpdate(profileID, { $push: { likes:  userID  } }, { new: true });
      console.log(updatedProfile,'updatedProfile');
    if (!updatedProfile) return res.json(new ApiResponse(500, 'unable to like the profile.'));

    return res.json(new ApiResponse(200, updatedProfile, 'profile liked'));

  }
  catch (err) {
    return handleErr(res, err);
  }
}


const dislike_profile = async (req, res) => {
  try {
    const { userID, profileID } = req.body;  // profileID: profile to be liked and userID: user which is liking the profile.
    if (!userID || !profileID) return res.json(new ApiResponse(400, null, 'userID or profileID not provided.'))

    const profile = await Profile.findById(profileID);
    const user = await User.findById(userID);

    if (!user || !profile) return res.json(new ApiResponse(404, null, 'Data not found.'));

    const updatedProfile = await Profile.findByIdAndUpdate(profileID, { $pull: { likes: { userID } } }, { new: true });

    if (!updatedProfile) return res.json(new ApiResponse(500, 'unable to dislike the profile.'));

    return res.json(new ApiResponse(200, updatedProfile, 'profile disliked'));

  }
  catch (err) {
    return handleErr(res, err);
  }
}

const calculateProfileCompleteness = async (req, res) => {
  try {
    const { userID } = req.body;
    if (!userID) return res.json(new ApiResponse(400, null, 'User ID not provided.'));

    const profile = await Profile.findOne({ userID });
    if (!profile) return res.json(new ApiResponse(404, null, 'Profile not found.'));

    let completeness = 0;
    const totalCriteria = 10;

    if (profile.profilePic) completeness += 1;
    if (profile.bio) completeness += 1;
    if (profile.gender) completeness += 1;
    if (profile.dob) completeness += 1;
    if (profile.lookingFor) completeness += 1;
    if (profile.height) completeness += 1;
    if (profile.location) completeness += 1;
    if (profile.relationshipPreference) completeness += 1;
    if (profile.userPhotos && profile.userPhotos.length > 0) completeness += 1;
    if (profile.promptsAnswers && profile.promptsAnswers.length > 0 && profile.promptsAnswers.length <= 3) completeness += 1;

    const compPer = (completeness / totalCriteria) * 100;

    profile.completeness = compPer;
    await profile.save();

    return res.json(new ApiResponse(200, { completeness: compPer }, 'Profile completeness calculated and updated successfully.'));
  } catch (err) {
    return handleErr(res, err);
  }
};

// const fetch_by_preferences = async (req, res) => {
//   try {
//     const { userID } = req.body;
//     if (!userID) return res.json(new ApiResponse(400, null, 'User ID not provided.'));

//     // Fetch user preferences
//     const userPreferences = await UserPreferences.findOne({ userID: new mongoose.Types.ObjectId(userID) });
//     if (!userPreferences) return res.json(new ApiResponse(404, null, 'User preferences not found.'));

//     // Calculate date range based on age preference
//     const today = new Date();
//     const minAgeDate = new Date(today.setFullYear(today.getFullYear() - userPreferences.ageRange.max));
//     const maxAgeDate = new Date(today.setFullYear(today.getFullYear() - userPreferences.ageRange.min));

//     // Build query conditions
//     const mandatoryConditions = [
//       { gender: { $regex: userPreferences.preferredGender, $options: 'i' } }, // Match gender
//     ];
//     const optionalConditions = [];

//     // Include age range as mandatory unless `exceedAge` is true
//     if (userPreferences.exceedAge) {
//       mandatoryConditions.push({
//         dob: {
//           $gte: minAgeDate,
//           $lte: maxAgeDate
//         }
//       });
//     } else{
//       optionalConditions.push({
//         dob: {
//           $gte: minAgeDate,
//           $lte: maxAgeDate
//         }
//       });
//     }

//     // Match relationship preference
//     if (userPreferences.relationshipPreference) {
//       optionalConditions.push({ relationshipPreference: { $regex: userPreferences.relationshipPreference, $options: 'i' } });
//     }

//     // Match language preference
//     if (userPreferences.language) {
//       optionalConditions.push({ language: { $regex: userPreferences.language, $options: 'i' } });
//     }

//     // Combine query with `$and` and `$or`
//     const query = {
//       "$and": mandatoryConditions,
//       ...(optionalConditions.length > 0 && { "$or": optionalConditions }),
//     };

//     // Fetch profiles
//     const result = await Profile.find(query).populate('userID');

//     if (!result || result.length === 0) {
//       return res.json(new ApiResponse(404, null, 'No matching profiles found.'));
//     }

//     // Calculate similarity scores for matches
//     const scoredMatches = await Promise.all(
//       result.map(async (match) => {
//         try {
//           const score = await calculateProfileSimilarity(userPreferences, match);
//           return { match, score };
//         } catch (error) {
//           console.error('Error calculating similarity:', error);
//           return null;
//         }
//       })
//     );

//     // Filter out null results and sort by score
//     const validMatches = scoredMatches.filter((item) => item !== null);
//     validMatches.sort((a, b) => b.score - a.score);

//     // Save matched profiles to user's profile
//     const userProfile = await Profile.findOne({ userID: userID });
//     if (!userProfile) {
//       return res.json(new ApiResponse(404, null, 'User profile not found.'));
//     }
//     userProfile.preferredProfiles = validMatches;
//     await userProfile.save();

//     return res.json(new ApiResponse(200, userProfile.preferredProfiles, 'Matching profiles fetched successfully.'));
//   } catch (err) {
//     console.error('Error in fetch_by_preferences:', err);
//     return handleErr(res, err);
//   }
// };


// const fetch_by_preferences = async (req, res) => {
//   try {
//     const { userID, lat, lng, radius = 5 } = req.body;
//     if (!userID) return res.json(new ApiResponse(400, null, 'User ID not provided.'));

//     // Fetch user preferences
//     const userPreferences = await UserPreferences.findOne({ userID: new mongoose.Types.ObjectId(userID) });
//     if (!userPreferences) return res.json(new ApiResponse(404, null, 'User preferences not found.'));

//     // Calculate date range based on age preference
//     const today = new Date();
//     const minAgeDate = new Date(today.setFullYear(today.getFullYear() - userPreferences.ageRange.max));
//     const maxAgeDate = new Date(today.setFullYear(today.getFullYear() - userPreferences.ageRange.min));

//     // Build query conditions
//     const mandatoryConditions = [
//       { gender: { $regex: userPreferences.preferredGender, $options: 'i' } },
//     ];
//     const optionalConditions = [];

//     // Include age range as mandatory unless `exceedAge` is true
//     if (userPreferences.exceedAge) {
//       mandatoryConditions.push({
//         dob: {
//           $gte: minAgeDate,
//           $lte: maxAgeDate
//         }
//       });
//     } else {
//       optionalConditions.push({
//         dob: {
//           $gte: minAgeDate,
//           $lte: maxAgeDate
//         }
//       });
//     }

//     // Match relationship preference
//     if (userPreferences.relationshipPreference) {
//       optionalConditions.push({ relationshipPreference: { $regex: userPreferences.relationshipPreference, $options: 'i' } });
//     }

//     // Match language preference
//     if (userPreferences.language) {
//       optionalConditions.push({ language: { $regex: userPreferences.language, $options: 'i' } });
//     }

//     // Add distance radius filtering using geospatial query
//     if (lat && lng) {
//       mandatoryConditions.push({
//         location: {
//           $near: {
//             $geometry: { type: "Point", coordinates: [lng, lat] },
//             $maxDistance: radius * 1000
//           }
//         }
//       });
//     }

//     // Combine query with `$and` and `$or`
//     const query = {
//       "$and": mandatoryConditions,
//       ...(optionalConditions.length > 0 && { "$or": optionalConditions }),
//     };

//     console.log("MANDATORY:", mandatoryConditions);
//     console.log("OPTIONAL:", optionalConditions);
//     // Fetch profiles
//     const result = await Profile.find(query).populate('userID');

//     if (!result || result.length === 0) {
//       return res.json(new ApiResponse(404, null, 'No matching profiles found.'));
//     }

//     // Calculate similarity scores for matches
//     const scoredMatches = await Promise.all(
//       result.map(async (match) => {
//         try {
//           const score = await calculateProfileSimilarity(userPreferences, match);
//           return { match, score };
//         } catch (error) {
//           console.error('Error calculating similarity:', error);
//           return null;
//         }
//       })
//     );

//     // Filter out null results and sort by score
//     const validMatches = scoredMatches.filter((item) => item !== null);
//     validMatches.sort((a, b) => b.score - a.score);

//     // Save matched profiles to user's profile
//     const userProfile = await Profile.findOne({ userID: userID });
//     if (!userProfile) {
//       return res.json(new ApiResponse(404, null, 'User profile not found.'));
//     }
//     userProfile.preferredProfiles = validMatches;
//     await userProfile.save();

//     return res.json(new ApiResponse(200, userProfile.preferredProfiles, 'Matching profiles fetched successfully.'));
//   } catch (err) {
//     console.error('Error in fetch_by_preferences:', err);
//     return handleErr(res, err);
//   }
// };


const fetch_by_preferences = async (req, res) => {
  try {
    const { userID } = req.body;
    console.log("REQ BODY:", req.body);
    if (!userID) return res.json(new ApiResponse(400, null, 'User ID not provided.'));

    // Fetch user preferences
    const userPreferences = await UserPreferences.findOne({ userID: new mongoose.Types.ObjectId(userID) });
    const profile = await Profile.findOne({ userID: new mongoose.Types.ObjectId(userID) });
    const lat = profile.location.coordinates[1];
    const lng = profile.location.coordinates[0];
    const radius = userPreferences.distance;

    if (!userPreferences) return res.json(new ApiResponse(404, null, 'User preferences not found.'));

    // Calculate date range based on age preference
    const today = new Date();
    const minAgeDate = new Date(today.getFullYear() - userPreferences.ageRange.max, today.getMonth(), today.getDate());
    const maxAgeDate = new Date(today.getFullYear() - userPreferences.ageRange.min, today.getMonth(), today.getDate());


    // Build query conditions
    const mandatoryConditions = [];
    const optionalConditions = [];

    // Gender preference is mandatory
    // if (profile.lookingFor) {
    //   const normalizedLookingFor = profile.lookingFor?.trim().toLowerCase();
    //   mandatoryConditions.push({ gender: { $regex: `^${normalizedLookingFor}$`, $options: 'i' } });
    // } else {
    //   console.warn("Looking For field is missing or empty");
    // }

    // Add age range condition
    if (!userPreferences.exceedAge) {
      mandatoryConditions.push({ dob: { $gte: minAgeDate, $lte: maxAgeDate } });
    } else {
      optionalConditions.push({ dob: { $gte: minAgeDate, $lte: maxAgeDate } });
    }

    // Relationship preference is optional
    if (userPreferences.relationshipPreference) {
      optionalConditions.push({ relationshipPreference: { $regex: userPreferences.relationshipPreference, $options: 'i' } });
    }

    // Language preference is optional
    if (userPreferences.language) {
      optionalConditions.push({ language: { $regex: userPreferences.language, $options: 'i' } });
    }

    // Add distance radius filtering using geospatial query
    if (lat && lng) {
      mandatoryConditions.push({
        location: {
          $near: {
            $geometry: { type: "Point", coordinates: [lng, lat] },
            $maxDistance: radius * 1000,
          },
        },
      });
    }

    // Combine query with `$and` and `$or`
    const query = {
      $and: mandatoryConditions,
      ...(optionalConditions.length > 0 && { $or: optionalConditions }),
    };

    // console.log("MANDATORY:", JSON.stringify(mandatoryConditions, null, 2));
    // console.log("OPTIONAL:", JSON.stringify(optionalConditions, null, 2));
    console.log("QUERY:", JSON.stringify(query, null, 2));

    // Fetch profiles
    const result = await Profile.find(query).populate('userID');
    if (!result || result.length === 0) {
      return res.json(new ApiResponse(404, null, 'No matching profiles found.'));
    }
    console.log('MATCHES:', result);

    // Calculate similarity scores for matches
    const scoredMatches = await Promise.all(
      result.map(async (match) => {
        try {
          const score = await calculateProfileSimilarity(userPreferences, match);
          return { match, score };
        } catch (error) {
          console.error('Error calculating similarity:', error);
          return null;
        }
      })
    );

    // Filter out null results and sort by score
    const validMatches = scoredMatches.filter((item) => item !== null);
    validMatches.sort((a, b) => b.score - a.score);
    // Save matched profiles to user's profile
    const userProfile = await Profile.findOne({ userID: userID });
    if (!userProfile) {
      return res.json(new ApiResponse(404, null, 'User profile not found.'));
    }
    userProfile.preferredProfiles = validMatches;
    await userProfile.save();

    return res.json(new ApiResponse(200, userProfile.preferredProfiles, 'Matching profiles fetched successfully.'));
  } catch (err) {
    console.error('Error in fetch_by_preferences:', err);
    return handleErr(res, err);
  }
};



const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const toRadians = (degree) => degree * (Math.PI / 180);
  const R = 6371;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// const update_user_location = async (req, res) => {
//   try {
//     console.log("Request received for updating location:", req.body);
//     const { userID, latitude, longitude } = req.body;
//     console.log(req.body)
//     if (!userID || latitude === undefined || longitude === undefined) {
//       console.error("Invalid request data:", req.body);
//       return res.json(new ApiResponse(400, null, "Invalid request data."));
//     }

//     const userProfile = await Profile.findOne({ userID: new mongoose.Types.ObjectId(userID) });
//     if (!userProfile) {
//       console.error("User profile not found for userID:", userID);
//       return res.json(new ApiResponse(404, null, "User profile not found."));
//     }
//     // console.log(userProfile)

//     const previousLocation = userProfile.location;
//     let distanceTravelled = 0;

//     if (previousLocation?.latitude && previousLocation?.longitude) {
//       distanceTravelled = calculateDistance(
//         parseFloat(previousLocation.latitude),
//         parseFloat(previousLocation.longitude),
//         parseFloat(latitude),
//         parseFloat(longitude)
//       );
//       console.log("Distance travelled:", distanceTravelled);
//     }

//     const hasMovedExtensively = distanceTravelled > 40;
//     console.log("Has moved extensively:", hasMovedExtensively);

//     userProfile.location.coordinates = [
//       parseFloat(location.longitude),
//       parseFloat(location.latitude),
//     ];
//     userProfile.lastLocationUpdate = new Date();
//     await userProfile.save();
//     console.log("Location updated successfully for userID:", userID);

//     return res.json(
//       new ApiResponse(200, { hasMovedExtensively }, "Location updated successfully.")
//     );
//   } catch (err) {
//     console.error("Error updating location:", err);
//     return res.status(500).json(new ApiResponse(500, null, "Internal server error."));
//   }
// };



const update_user_location = async (req, res) => {
  try {
    const { userID, latitude, longitude } = req.body;

    if (!userID || latitude === undefined || longitude === undefined) {
      return res.json(new ApiResponse(400, null, "Invalid request data."));
    }

    console.log("Request Body:", req.body); // Log request body for debugging

    const userProfile = await Profile.findOne({ userID });
    if (!userProfile) {
      return res.json(new ApiResponse(404, null, "User profile not found."));
    }

    const previousLocation = userProfile.location;
    let distanceTravelled = 0;

    if (previousLocation?.coordinates) {
      const [prevLongitude, prevLatitude] = previousLocation.coordinates;
      distanceTravelled = calculateDistance(
        parseFloat(prevLatitude),
        parseFloat(prevLongitude),
        parseFloat(latitude),
        parseFloat(longitude)
      );
    }

    const hasMovedExtensively = distanceTravelled > 40;

    userProfile.location = {
      type: "Point",
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
    };
    userProfile.lastLocationUpdate = new Date();

    await userProfile.save();

    return res.json(
      new ApiResponse(200, { hasMovedExtensively }, "Location updated successfully.")
    );
  } catch (err) {
    console.error("Error updating location:", err);
    return res.status(500).json(new ApiResponse(500, null, "Internal server error."));
  }
};




/******  a331bc30-37a5-4c15-b4d5-90114f772be4  *******/

// const fetch_by_preferences = async (req, res) => {
//   try {
//     const { userID } = req.body;
//     if (!userID) return res.json(new ApiResponse(400, null, 'User id not provided.'));

//     const userPreferences = await UserPreferences.findOne({ userID: new mongoose.Types.ObjectId(userID) });
//     if (!userPreferences) return res.json(new ApiResponse(404, null, 'User preferences not found.'));

//     const userProfile = await Profile.findOne({ userID: new mongoose.Types.ObjectId(userID) });
//     if (!userProfile) return res.json(new ApiResponse(404, null, 'User profile not found.'));

//     const userLocation = userPreferences.location;

//     // Calculate age range
//     const today = new Date();
//     const minAgeDate = new Date(today.setFullYear(today.getFullYear() - userPreferences.ageRange.max));
//     const maxAgeDate = new Date(today.setFullYear(today.getFullYear() - userPreferences.ageRange.min));

//     const potentialMatches = await Profile.find({
//       dob: { $gte: minAgeDate, $lte: maxAgeDate },
//       gender: { $regex: userPreferences.preferredGender, $options: 'i' },
//       relationshipPreference: { $regex: userPreferences.relationshipPreference, $options: 'i' },
//     }).populate('userID');

//     // Calculate distances and filter by proximity
//     const distanceThreshold = 500 * 1000; // Example threshold: 50 km
//     const matchesWithinRange = potentialMatches.filter((match) => {
//       if (!match.location || !match.location.latitude || !match.location.longitude) return false;

//       const matchLocation = {
//         latitude: match.location.latitude,
//         longitude: match.location.longitude,
//       };
//       const distance = haversine(userLocation, matchLocation);
//       return distance <= distanceThreshold;
//     });

//     // Score matches
//     const scoredMatches = await Promise.all(
//       matchesWithinRange.map(async (match) => {
//         try {
//           const score = await calculateProfileSimilarity(userPreferences, match);
//           return { match: match, score };
//         } catch (error) {
//           console.error('Error calculating similarity:', error);
//           return null; // Skip if there's an error
//         }
//       })
//     );

//     const validMatches = scoredMatches.filter((item) => item !== null);

//     // Sort by score
//     validMatches.sort((a, b) => b.score - a.score);

//     userProfile.preferredProfiles = validMatches;
//     await userProfile.save();

//     if (!validMatches || validMatches.length === 0) {
//       return res.json(new ApiResponse(404, null, 'No matching users found.'));
//     }

//     return res.json(new ApiResponse(200, userProfile.preferredProfiles, 'Matching users fetched successfully.'));
//   } catch (err) {
//     console.error('Error in fetch_by_preferences:', err);
//     return handleErr(res, err);
//   }
// };

// const fetch_by_preferences = async (req, res) => {
//   try {
//     const { userID } = req.body;
//     if (!userID) return res.json(new ApiResponse(400, null, 'User id not provided.'));

//     const userPreferences = await UserPreferences.findOne({ userID: new mongoose.Types.ObjectId(userID) });
//     if (!userPreferences) return res.json(new ApiResponse(404, null, 'User preferences not found.'));

//     const userProfile = await Profile.findOne({ userID: new mongoose.Types.ObjectId(userID) });
//     if (!userProfile) return res.json(new ApiResponse(404, null, 'User profile not found.'));

//     // Commented out: Location-based filtering logic
//     // const userLocation = userPreferences.location;

//     // Calculate age range
//     const today = new Date();
//     const minAgeDate = new Date(today.setFullYear(today.getFullYear() - userPreferences.ageRange.max));
//     const maxAgeDate = new Date(today.setFullYear(today.getFullYear() - userPreferences.ageRange.min));

//     const potentialMatches = await Profile.find({
//       dob: { $gte: minAgeDate, $lte: maxAgeDate },
//       gender: { $regex: userPreferences.preferredGender, $options: 'i' },
//       relationshipPreference: { $regex: userPreferences.relationshipPreference, $options: 'i' },
//     }).populate('userID');

//     // Commented out: Filtering matches by proximity
//     // const distanceThreshold = 50 * 1000; // Example threshold: 50 km
//     // const matchesWithinRange = potentialMatches.filter((match) => {
//     //   if (!match.location || !match.location.latitude || !match.location.longitude) return false;

//     //   const matchLocation = {
//     //     latitude: match.location.latitude,
//     //     longitude: match.location.longitude,
//     //   };
//     //   const distance = haversine(userLocation, matchLocation);
//     //   return distance <= distanceThreshold;
//     // });

//     // For now, use all potential matches
//     const matchesWithinRange = potentialMatches;

//     // Score matches
//     const scoredMatches = await Promise.all(
//       matchesWithinRange.map(async (match) => {
//         try {
//           const score = await calculateProfileSimilarity(userPreferences, match);
//           return { match: match, score };
//         } catch (error) {
//           console.error('Error calculating similarity:', error);
//           return null; // Skip if there's an error
//         }
//       })
//     );

//     const validMatches = scoredMatches.filter((item) => item !== null);

//     // Sort by score
//     validMatches.sort((a, b) => b.score - a.score);

//     userProfile.preferredProfiles = validMatches;
//     await userProfile.save();

//     if (!validMatches || validMatches.length === 0) {
//       return res.json(new ApiResponse(404, null, 'No matching users found.'));
//     }

//     return res.json(new ApiResponse(200, userProfile.preferredProfiles, 'Matching users fetched successfully.'));
//   } catch (err) {
//     console.error('Error in fetch_by_preferences:', err);
//     return handleErr(res, err);
//   }
// };


const fetch_by_id = async (req, res) => {
  try {
    const { profileID } = req.body;
    if (!profileID) return res.json(new ApiResponse(400, null, 'User id not provided.'));
    const profile = await Profile.findById(profileID);
    if (!profile) return res.json(new ApiResponse(404, null, 'profile not found.'));
    return res.json(new ApiResponse(200, profile, 'profile fetched successfully.'));
  }
  catch (err) {
    return handleErr(res, err);
  }
}

export {
  updateProfile,
  fetch_by_preferences,
  update_user_location,
  like_profile,
  dislike_profile,
  calculateProfileCompleteness,
  fetch_by_id
}