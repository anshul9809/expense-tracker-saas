const expressAsyncHandler = require("express-async-handler");
const Income = require("../models/Income");
const User = require("../models/User");
const {validateMongoDbId} = require("../utils/validateMongoDbId");


const createIncome = expressAsyncHandler(async (req, res) => {
    const { title, amount, category, description, date } = req.body;

    // Validate required fields
    if (!title || !amount || !category) {
        res.status(400);
        throw new Error('Please add all required fields');
    }

    // Finding the user associated with the income
    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    // Create a new Income record
    const income = await Income.create({
        title,
        amount,
        category,
        description,
        date,
        user: req.user._id
    });



    // Updating the user's totalIncome, totalBalance, and totalSavings
    user.totalIncome += amount;
    user.totalBalance += amount; // This assumes totalBalance starts at 0 and only increases with income
    user.totalSavings = user.totalBalance - user.totalExpense; 
    
    // Pushing the new income ID to the user's incomes array
    user.incomes.push(income._id);
    
    // Saving the updated user document
    await user.save();

    res.status(201).json({
        success: true,
        income,
        message: 'Income created and user updated'
    });
});

const updateIncome = expressAsyncHandler(async (req,res)=>{
    const {id} = req.params;
    const {title, amount, category, description, date} = req.body;
    validateMongoDbId(id)

    const income = await Income.findById(id);
    if (!income) {
        res.status(404);
        throw new Error('Income not found');
    }
    
    if(income.user.toString() !== req.user._id.toString()){
        res.status(403);
        throw new Error("You are not authorized to update this income");
    }
    
    const previousAmount = income.amount;

    const updatedIncome = await  Income.findByIdAndUpdate(id, {
        title,
        amount,
        category,
        description,
        date
    }, {new:true});

    if(previousAmount !== amount){
        const user = await User.findById(req.user._id);
        user.totalIncome = user.totalIncome - previousAmount + amount;
        user.totalBalance = user.totalBalance - previousAmount + amount; // This assumes totalBalance starts at 0 and only increases
        user.totalSavings = user.totalBalance - user.totalExpense;

        await user.save();
    }
    res.status(200).json({
        success:true,
        income:updatedIncome,
        message:"Income updated successfully"
    });
});

const getSingleIncome = expressAsyncHandler(async (req,res)=>{
    const {id} = req.params;
    validateMongoDbId(id);
    const income = await Income.findById(id);
    if(income.user.toString() !== req.user._id.toString()){
        res.status(403);
        throw new Error("You are not authorized to view this income");
    }
    res.status(200).json({
        success:true,
        income:income
    });
});

const getAllIncomes = expressAsyncHandler(async (req,res)=>{
    const incomes = await Income.find({user:req.user._id}).sort({date:-1});
    res.status(200).json({
        success:true,
        incomes:incomes
    });
});

const deleteIncome = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);

    // Finding the income to delete
    const income = await Income.findById(id);
    if (!income) {
        res.status(400);
        throw new Error('Income not found');
    }

    // Checking if the income belongs to the current user
    if (income.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('You are not authorized to delete this income');
    }

    
    // Updating user totals
    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    user.totalIncome = Math.max(0, user.totalIncome - income.amount);
    user.totalBalance = Math.max(0, user.totalBalance - income.amount);
    user.totalSavings = Math.max(0, user.totalBalance - user.totalExpense);

    // Removing the income ID from the user's incomes array
    user.incomes.pull(income._id);
    
    // Saving the updated user document and deleting the income
    await user.save();
    await Income.findByIdAndDelete(id);

    res.status(200).json({
        success: true,
        message: 'Income deleted successfully'
    });
});

module.exports = deleteIncome;




module.exports = {
    createIncome,
    updateIncome,
    getSingleIncome,
    getAllIncomes,
    deleteIncome
};