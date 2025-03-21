import express from "express"
import { getProfile, loginUser, logoutUser, registerUser, requestResetPassword, resetPassword, verifyUser } from "../controller/user.controller.js"
import { isLoggedIn } from "../middleware/auth.middleware.js"

const router = express.Router()

router.post("/register", registerUser)
router.get("/verify/:token", verifyUser)
router.post("/login", loginUser)
router.get("/me", isLoggedIn, getProfile)
router.get("/logout", isLoggedIn, logoutUser)
router.post("/reset-password-request", requestResetPassword)
router.post("/reset-password/:token", resetPassword)

export default router