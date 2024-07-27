const express = require("express");
const router = express.Router();
const {authMiddleware, checkBanned} = require("../middlewares/authMiddleware");

router.use("/users", require("./userRoutes"));
router.use("/admin", require("./adminRoutes"));
router.use("/expense", authMiddleware, checkBanned, require("./expenseRoutes"));
router.use("/income", authMiddleware, checkBanned, require("./incomeRoutes"));

module.exports = router;