const expressAsyncHandler = require("express-async-handler");
const Expense = require("../models/Expense");
const User = require("../models/User");
const {validateMongoDbId} = require("../utils/validateMongoDbId");

const createExpense = expressAsyncHandler(async (req,res)=>{

    const {title, amount, category, description, date} = req.body;
    if(!title || !amount || !category){
        res.status(400);
        throw new Error("Please add all fields");
    }

    const expense = await Expense.create({
        title,
        amount,
        category,
        description,
        date,
        user: req.user._id
    });

    res.status(201).json({
        success: true,
        expense,
        message: "Expnese created"
    });
});

module.exports = {
    createExpense
};