import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
const registerUser = asyncHandler(async (req, res) => {
  // get user detail from frontend
  //validation - not empty
  //check if user already exist : user email
  //check for images , check for avatar
  //upload them to cloudinary , avatar
  //create user object - create entry in db
  //remove password and refresh token field from response
  //check for user creation
  //return res

  const { fullname, email, username, password } = req.body;
  console.log("email", email);

  //you can handle one by one
  // if(fullname === ""){
  //     throw new ApiError(400,"full name is required")
  // }

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
  }
});

export { registerUser };
