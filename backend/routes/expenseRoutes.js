const express = require("express");
const router = express.Router();
const {
    createExpense,
    updateExpense,
    deleteExpense,
    getExpense,
    getAllExpenses
} = require("../controllers/expenseController");
const {authMiddleware, checkBanned} = require("../middlewares/authMiddleware");

router.post("/create", authMiddleware, checkBanned, createExpense);
router.put("/update/:id", authMiddleware, checkBanned, updateExpense);
router.delete("/delete/:id", authMiddleware, checkBanned, deleteExpense);
router.get("/:id", authMiddleware, checkBanned, getExpense);
router.get("/", authMiddleware, checkBanned, getAllExpenses);

module.exports = router;