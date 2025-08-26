import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uplodeonCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefressTokens = async(userId) =>
   {
    try {
      const user = await User.findById(userId)
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()

      user.refreshToken = refreshToken
      await user.save({ validataBeforeSave:false })

      return {accessToken , refreshToken}

    } catch (error) {
      throw new ApiError(500,"something went wrong while generating access and refress token")
    }
   }

const registerUser = asyncHandler(async (req, res) => {
  /*
  1-> get user detail from frontend
  2-> validation - not empty
  3-> check if user already exist : user email
  4-> check for images , check for avatar
  5-> upload them to cloudinary , avatar
  6-> create user object - create entry in db
  7-> remove password and refresh token field from response
  8-> check for user creation
  9-> return response
  */

  // get user detail from frontend
  const { fullname, email, username, password } = req.body;
  console.log("email", email);

  // console.log("req.body ->", req.body);

  //you can handle one by one
  /*
  if(fullname === ""){
      throw new ApiError(400,"full name is required")
  }
  */

  //validation - not empty
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  //check if user already exist : user email
  // check by username
  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    throw new ApiError(409, "Username already exists");
  }

  // check by email
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    throw new ApiError(409, "Email already exists");
  }

  //check for images , check for avatar
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  // yaha pe humne [ ?. ] use kiya hai (coverImage?.[0]) agar cover image hogi to lelega nahi to empty rahega same problem ko sir ne clasical way se solve kiya hai

  //clasical way to check
  /*
  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverimage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path
  }
*/

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar file is required");
  }

  //upload them to cloudinary , avatar
  const avatar = await uplodeonCloudinary(avatarLocalPath);
  const coverImage = await uplodeonCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  //create user object - create entry in db
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // remove password and refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // check for user creation
  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registring a user");
  }

  // return response
  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { ...createdUser._doc },
        "user registered successfully"
      )
    );
});

const loginUser = asyncHandler(async (req, res) => {
  /* 
   1-> req body => data
   2-> check username or email
   3-> find the user
   4-> password check
   5-> access and refress token
   6-> send cookie
  */

  //  1-> req body => data
  const { email, username, password } = req.body;
  console.log(email)
  //  2-> check username or email
  if (!username && !email) {
    throw new ApiError(400, "username and email is required ");
  }

  // if (!(username || email)) {
  //   throw new ApiError(400, "username and email is required ");
  // }

  /*
   yaha pe hum confirm nahi nahi humko email se login karana hai ye
   username se to humko ya to username mil jaye ya email 
   */

  //  3-> find the user
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "user not exist");
  }

  //  4-> password check
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(404, "Invalid user cradiantials");
  }

  const {accessToken , refreshToken} = await
   generateAccessAndRefressTokens(user._id)

   const loggedInUser = await User.findById(user._id).
   select("-password -refreshToken")

   const options = {
    httpOnly : true,
    secure: true,
   }

   return res
   .status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",refreshToken,options)
   .json(
    new ApiResponse(
      200,
      {
        user:loggedInUser,accessToken,refreshToken
      },
      "User loggedIn successfully"
    )
   )
});

const logoutUser = asyncHandler(async (req,res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new: true
    }
  )

  const options = {
    httpOnly : true,
    secure: true,
   }

   return res
   .status(200)
   .clearCookie("accessToken",options)
   .json(new ApiResponse(200 , {} ,"User logedout Successfully"))
})

const refreshAccessToken = asyncHandler(async (req,res) => {
  const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken){
    throw new ApiError(401,"unauthorized request")
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
  
    const user = await User.findById(decodedToken?._id)
  
    if(!user){
      throw new ApiError(401,"Invalid refresh token")
    }
  
    if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401,"Refresh token expired or used")
    }
  
    const options = {
      httpOnly:true,
      secure:true
    }
  
    const {accessToken,newrefreshToken} = await generateAccessAndRefressTokens(user._id)
  
    return res
    .status(200)
    .cookie("accessToken",accessToken ,options)
    .cookie("refreshToken",newrefreshToken,options)
    .json(
      new ApiResponse(
        200,
        {
          accessToken,
          refreshToken : "newrefreshToken",
        },
        "access token refresh successffuly"
      )
    )
  } catch (error) {
    throw new ApiError(401,error?.message || "Invalid refresh token")
  }
})

const changeCurrentPassword = asyncHandler(async (req,res) => {
  const {oldPassword,newPassword} = req.body

  const user = await User.findById(req.user?._id)

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if(!isPasswordCorrect){
    throw new ApiError(400,"Innvalid old password")
  }

  user.password = newPassword
  await user.save({validataBeforeSave : false})

  return res
  .status(200)
  .json(new ApiResponse(200,{},"Password change successfully"))

})

const getCurrentUser = asyncHandler(async (req,res) => {
  return res
  .status(200)
  .json(new ApiResponse(200 , req.user , "Current user frtched successfuly"))
}) 

const updateAccountDetail = asyncHandler(async (req,res) => {
  const {fullname,email} = req.body

  if(!fullname || !email){
    throw new ApiError(400,"All fields are require")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullname,
        email
        // fullname : fullname
        // email: email
      }
    }, 
    {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200,user,"Account details updated successfully")
  )

})

const updateUserAvatar = asyncHandler(async (req,res) => {
  
  const avatarLocalPath = req.file?.path
  
  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is missing")
  }

  const avatar = await uplodeonCloudinary(avatarLocalPath)

  if(!avatar.url){
    throw new ApiError(400,"ERROR While uplodind on cloudinary")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: avatar.url
    },
    {new : true}
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200,{},"Avatar updated successfully"))

})

const updateUserCoverimage = asyncHandler(async (req,res) => {
  
  const coverImageLocalPath = req.file?.path
  
  if(!coverImageLocalPath){
    throw new ApiError(400,"CoverImage file is missing")
  }

  const coverImage = await uplodeonCloudinary(coverImageLocalPath)

  if(!coverImage.url){
    throw new ApiError(400,"ERROR While uplodind on cloudinary")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: coverImage.url
    },
    {new : true}
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200,{},"Coverimage updated successfully"))

})
 
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetail,
  updateUserAvatar,
  updateUserCoverimage
};