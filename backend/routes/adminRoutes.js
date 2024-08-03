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
    deleteUser,
    createSubscriptionPlan,
    updateSubscriptionPlan,
    deleteSubscriptionPlan,
    getAllSubscriptionPlans,
    getSingleSubscriptionPlan,
    getUsersBySubscriptionPlans
} = require("../controllers/adminController");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const {upload} = require("../config/cloudinary");

router.put("/changeStatus/:id", authMiddleware, isAdmin, changeUserStatus)
router.put("/subscription/:id", authMiddleware, isAdmin, updateSubscriptionPlan);
router.delete("/deleteUser/:id", authMiddleware, isAdmin, deleteUser);
router.get("/getUser/:id", authMiddleware, isAdmin, getUser);
router.post("/login", login);
router.get("/logout", logout);
router.get("/profile", authMiddleware, isAdmin, getAdminProfile);
router.get("/allUsers", authMiddleware, isAdmin, getAllUsers);
router.put("/updateAdmin", authMiddleware, isAdmin, upload.single('avatar'), updateAdminProfile);
router.post("/createSubscription", authMiddleware, isAdmin, createSubscriptionPlan);
router.delete("/subscription/:id", authMiddleware, isAdmin, deleteSubscriptionPlan);
router.get("/subscription/:id", authMiddleware, isAdmin, getSingleSubscriptionPlan);
router.get("/subscription", authMiddleware, isAdmin, getAllSubscriptionPlans);
router.get("/subscriptionUsers/:planId", authMiddleware, isAdmin, getUsersBySubscriptionPlans);

module.exports = router;