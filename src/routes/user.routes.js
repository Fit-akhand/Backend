import { Router } from "express";
import { loginUser,
      logoutUser,
      registerUser,
      refreshAccessToken,
      changeCurrentPassword,
      getCurrentUser,
      updateAccountDetail,
      updateUserAvatar,
      updateUserCoverimage,
      getUserChanelProfile,
      getWatchHistory } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { optionalJWT, verifyJWT } from "../middlewares/auth.middleware.js"
import { authLimiter, uploadLimiter } from "../middlewares/rateLimit.middleware.js"

const router = Router()

router.route('/register').post(
    authLimiter,
    uploadLimiter,
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
)

router.route("/login").post(authLimiter, loginUser)

//sequred routes
router.route("/logout").post(verifyJWT , logoutUser)
router.route("/refresh-token").post(authLimiter, refreshAccessToken)
router.route("/change_password").post(verifyJWT,changeCurrentPassword)
router.route("/current_user").get(verifyJWT,getCurrentUser)
router.route("/update_account").patch(verifyJWT,updateAccountDetail)
router.route("/avater").patch(verifyJWT,uploadLimiter,upload.single("avatar"),updateUserAvatar)
router.route("/cover_image").patch(verifyJWT,uploadLimiter,upload.single("coverImage"),updateUserCoverimage)
router.route("/c/:username").get(optionalJWT,getUserChanelProfile)
router.route("/History").get(verifyJWT,getWatchHistory)




export default router