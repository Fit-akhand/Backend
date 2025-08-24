import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";

export const varifyJWT = asyncHandler(async(req, _ ,next) => {
     try {
      const token = req.cokkies?.accessToken || req.header
      ("authorization")?.replace("Bearer ","")
 
      if (!token) {
         throw new ApiError(401,"Unauthorized request")
      }
 
      const decodetoken = jwt.verify(token,ACCESS_TOKEN_SECRET)
 
      const user = await User.findById(decodetoken?._id)
      .select("-password -refreshToken")
 
      if (!user) {
         // NEXT_VIDEO: discuss about frontend
         throw new ApiError(401,"Invalid Access Token")
      }
 
      req.user = user
      next()
     } catch (error) {
      throw new ApiError(401,error?.message || "Invalid acess token")
     }

})