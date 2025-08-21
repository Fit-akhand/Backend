import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uplodeonCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
  .json(new ApiResponse(201, { ...createdUser._doc }, "user registered successfully"));
});

export { registerUser }