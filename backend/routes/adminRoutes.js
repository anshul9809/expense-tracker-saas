const express = require("express");
const router = express.Router();
const { 
    login,
    getAllUsers,
    getUser,
    logout,
    getAdminProfile,
    updateAdminProfile,
    changeUserStatus,
    deleteUser
} = require("../controllers/adminController");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const {upload} = require("../config/cloudinary");

router.put("/changeStatus/:id", authMiddleware, isAdmin, changeUserStatus)
router.delete("/deleteUser/:id", authMiddleware, isAdmin, deleteUser);
router.get("/getUser/:id", authMiddleware, isAdmin, getUser);
router.post("/login", login);
router.get("/logout", logout);
router.get("/profile", authMiddleware, isAdmin, getAdminProfile);
router.get("/allUsers", authMiddleware, isAdmin, getAllUsers);
router.put("/updateAdmin", authMiddleware, isAdmin, upload.single('avatar'), updateAdminProfile);

module.exports = router;