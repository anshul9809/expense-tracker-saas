const express = require("express");
const router = express.Router();
const {
    createExpense
} = require("../controllers/expenseController");
const {authMiddleware} = require("../middlewares/authMiddleware");

router.post("/create", authMiddleware, createExpense);

module.exports = router;