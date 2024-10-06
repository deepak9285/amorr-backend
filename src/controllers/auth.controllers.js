import { Otp } from "../models/otp.model.js";
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

const sendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;
    // Delete all previous otps for the user
    await Otp.deleteMany({ email });
    const user = await User.findOne({ email });
    if (user) {
      return res.json(new ApiResponse(409, "User already exists!"));
    }
    // Generate a new otp
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    const mailOptions = {
      from: {
        name: process.env.AUTH_EMAIL_NAME,
        address: process.env.AUTH_EMAIL,
      },
      to: email,
      subject: "Verify your Email",
      html: `<p>Enter <b>${otp}</b> in the app to verify your email address and complete your signup</p><p>This otp expires in 10 minutes.</p>`,
    };

    const hashedOtp = await bcrypt.hash(otp, 12);
    const newOtp = new Otp({
      email,
      otp: hashedOtp,
    }).save();
    
    transporter.sendMail(mailOptions);

    return res.status(200).json(new ApiResponse(200, newOtp,"Otp sent successfully"));
  
  } 
  catch (err) {
    console.log(err);
    return res.json(new ApiError(400, err.message));
  }
};

const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.json(new ApiResponse(410, "All fields are required!"));
    }
  
    const existingUser = await User.findOne({ email });
  
    if (existingUser) {
      return res.json(new ApiResponse(409, "User already exists!"));
    }
  
    const hashedOtp = await Otp.findOne({ email });
  
    if (!hashedOtp) {
      return res.json(new ApiResponse(404, "Otp not found"));
    }
  
    const { createdAt } = hashedOtp;
    
    if (createdAt < Date.now() - 600000) {
      return res.json(
        new ApiResponse(422, "Otp has expired , please request again")
      );
    }

    const verify = bcrypt.compareSync(otp, hashedOtp.otp);

    if (verify) {
      await Otp.deleteOne({ email });
      return res.json(new ApiResponse(200, "Email verified successfully"));
    } 
    else {
      return res.json(new ApiResponse(400, "Otp entered is wrong"));
    }

  } 
  catch (err) {
    // console.log(err);
    return res.json(new ApiError(400, "verification failed", err.message));
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
  register,
  sendEmailOtp,
  verifyEmailOtp
}