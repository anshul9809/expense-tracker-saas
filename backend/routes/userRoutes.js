const express = require("express");
const router = express.Router();
const {upload} = require("../config/cloudinary");
const { 
    register,
    login,
    getUserProfile,
    logout,
    updateUserProfile,
    updatePassword,
    verifyEmail,
    forgotPassword,
    resetPassword
} = require("../controllers/userController");
const { authMiddleware } = require("../middlewares/authMiddleware")

router.post("/register", register);
router.post("/login", login);
router.post("/update/password", authMiddleware, updatePassword);
router.put("/profile/update", authMiddleware, upload.single('avatar'), updateUserProfile);
router.get("/verify-email/:token", verifyEmail);
router.get("/logout", authMiddleware, logout);
router.get("/profile", authMiddleware, getUserProfile);
router.post("/forgotPassword", forgotPassword);
router.put("/resetPassword/:token", resetPassword);


module.exports = router;