import { Router } from "express";
import { registerUser } from "../src/controllers/user.controller.js";

const router = Router()

router.route('/register').post(registerUser)

export default router