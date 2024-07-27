const express = require("express");
const router = express.Router();

router.use("/users", require("./userRoutes"));
router.use("/admin", require("./adminRoutes"));
router.use("/expense", require("./expenseRoutes"));
router.use("/income", require("./incomeRoutes"));

module.exports = router;