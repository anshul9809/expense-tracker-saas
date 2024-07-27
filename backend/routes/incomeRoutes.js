const express = require("express");

const router = express.Router();
const {authMiddleware} = require("../middlewares/authMiddleware");
const {
    createIncome,
    updateIncome,
    getSingleIncome,
    getAllIncomes,
    deleteIncome
} = require("../controllers/incomeController");

router.post("/create", authMiddleware, createIncome);
router.get("/", authMiddleware, getAllIncomes);
router.get("/:id", authMiddleware, getSingleIncome);
router.put("/update/:id", authMiddleware, updateIncome);
router.delete("/delete/:id", authMiddleware, deleteIncome);

module.exports = router;
