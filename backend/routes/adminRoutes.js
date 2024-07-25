const express = require("express");
const router = express.Router();
const { 
    login,
    getAllUsers,
    getUser,
    logout,
    getAdminProfile,
    updateAdminProfile,
    deleteUser,
    changeUserStatus
} = require("../controllers/adminController");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const {upload} = require("../config/cloudinary");

router.post("/login", login);
router.get("/logout", logout);
router.get("/profile", authMiddleware, isAdmin, getAdminProfile);
router.get("/allUsers", authMiddleware, isAdmin, getAllUsers);
router.get("/getUser/:id", authMiddleware, isAdmin, getUser);
router.put("/updateAdmin", authMiddleware, isAdmin, upload.single('avatar'), updateAdminProfile);
router.put("/changeStatus/:id", authMiddleware, isAdmin, changeUserStatus)
router.delete("deleteUser/:id", authMiddleware, isAdmin, deleteUser);

module.exports = router;