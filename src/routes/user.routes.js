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
import { varifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.route('/register').post(
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

router.route("/login").post(loginUser)

//sequred routes
router.route("/logout").post(varifyJWT , logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change_password").post(varifyJWT,changeCurrentPassword)
router.route("/current_user").get(varifyJWT,getCurrentUser)
router.route("/update_account").patch(varifyJWT,updateAccountDetail)
router.route("/avater").patch(varifyJWT,upload.single("avatar"),updateUserAvatar)
router.route("/cover_image").patch(varifyJWT,upload.single("coverImage"),updateUserCoverimage)
router.route("/c/:username").get(varifyJWT,getUserChanelProfile)
router.route("/History").get(varifyJWT,getWatchHistory)




export default router