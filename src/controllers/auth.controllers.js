import { User } from "../models/user.model.js";
import { handleErr } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";


const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findOne(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (err) {
    console.log(err);
    return res.json(new ApiError(400, "Error generating token! ", err));
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email && !password) {
      return res.json(new ApiResponse(410, "All fields are required!"));
    }
    const user = await User.findOne({ email });

    if (!user) {
      return res.json(new ApiResponse(404,null , "User not found!"));
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
      return res.json(new ApiResponse(401, null ,"Password incorrect!"));
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
    };
    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    return res
      .status(200)
      .cookie("refreshToken", refreshToken, options)
      .cookie("accessToken", accessToken, options)
      .json(new ApiResponse(200, loggedInUser, "User logged in successfully"));
  } catch (err) {
    return handleErr(res, err);
  }
};



const register = async(req,res)=>{
  try{
    const { username, email, password } = req.body;
    if (!username || !email || !password ) {
      return res.json(new ApiResponse(410, "All fields are required!"));
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json(new ApiResponse(409, "User already exists!"));
    }
    const newUser = await User.create({
      username,
      email,
      password
    });

    return res.json(
      new ApiResponse(201, newUser, "User registered successfully!")
    );
  }
  catch(err){
    return handleErr(res,err);
  }
}


export {
  loginUser,
  register
}