const express = require("express");
const router = express.Router();
const { 
    register,
    login,
    getUserProfile,
    logout,
    updateUserProfile,
    updatePassword
} = require("../controllers/userController");
const { authMiddleware } = require("../middlewares/authMiddleware")

router.post("/register", register);
router.post("/login", login);
router.get("/logout", authMiddleware, logout);
router.get("/profile", authMiddleware, getUserProfile);
router.put("/profile/update", authMiddleware, updateUserProfile);
router.put("/update-password", authMiddleware, updatePassword);


module.exports = router;