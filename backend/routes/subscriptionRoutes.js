const express = require("express");
const router = express.Router();

const {
    getAllSubscriptionPlans,
    getSingleSubscriptionPlan,
    setUserSubscriptionPlan
} = require("../controllers/subscriptionsController");
const { authMiddleware, checkBanned } = require("../middlewares/authMiddleware");

router.put("/:id", checkBanned, authMiddleware, setUserSubscriptionPlan);
router.get("/", getAllSubscriptionPlans);
router.get("/:id", getSingleSubscriptionPlan);

module.exports = router