const expressAsyncHandler = require("express-async-handler");
const Expense = require("../models/Expense");
const User = require("../models/User");
const {validateMongoDbId} = require("../utils/validateMongoDbId");

// const createExpense = expressAsyncHandler(async (req, res) => {
//     const { title, amount, category, description, date, isRecurring, recurrenceInterval } = req.body;

//     if (!title || !amount || !category) {
//         res.status(400);
//         throw new Error("Please add all required fields");
//     }

//     if (amount < 0) {
//         res.status(400);
//         throw new Error("Please enter a positive amount");
//     }

//     // Find the user
//     const user = await User.findById(req.user._id);
//     if (!user) {
//         res.status(404);
//         throw new Error("User not found");
//     }

//     // Check if the user’s balance is sufficient
//     if (user.totalBalance < amount) {
//         res.status(400);
//         throw new Error("Insufficient balance");
//     }

//     // Create the expense
//     const expense = new Expense({
//         title,
//         amount,
//         category,
//         description,
//         date,
//         isRecurring,
//         recurrenceInterval,
//         nextOccurrenceDate:isRecurring?getNextOccurenceDate(recurrenceInterval):null,
//         user: req.user._id // Ensure the expense references the user
//     });

//     // Save the expense to the database
//     const savedExpense = await expense.save();

//     // Update user details
//     user.expenses.push(savedExpense._id); // Reference the newly created expense
//     user.totalExpense += amount;
//     user.totalBalance -= amount;

//     await user.save();

//     res.status(201).json({
//         success: true,
//         message: "Expense created successfully",
//         expense: savedExpense
//     });
// });

const getNextOccurrenceDate = (date, interval) => {
    const nextDate = new Date(date);

    if (interval === 'daily') nextDate.setDate(nextDate.getDate() + 1);
    if (interval === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
    if (interval === 'monthly') {
        nextDate.setMonth(nextDate.getMonth() + 1);
        if (date.getDate() > 28) {
            // Handle different month lengths
            nextDate.setDate(0); // Set to the last day of the month
        } else {
            nextDate.setDate(date.getDate());
        }
    }

    return nextDate;
};

const createExpense = expressAsyncHandler(async (req, res) => {
    const { title, amount, category, description, date, isRecurring, recurrenceInterval } = req.body;

    if (!title || !amount || !category) {
        res.status(400);
        throw new Error("Please add all required fields");
    }

    if (amount < 0) {
        res.status(400);
        throw new Error("Please enter a positive amount");
    }

    // Find the user
    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    // Check if the user’s balance is sufficient
    if (user.totalBalance < amount) {
        res.status(400);
        throw new Error("Insufficient balance");
    }

    const expenseDate = date ? new Date(date) : new Date();

    // Create the expense
    const expense = new Expense({
        title,
        amount,
        category,
        description,
        date: expenseDate,
        user: req.user._id,
        isRecurring: isRecurring || false,
        recurrenceInterval: recurrenceInterval || null,
        nextOccurrenceDate: isRecurring ? getNextOccurrenceDate(expenseDate, recurrenceInterval) : null
    });

    // Save the expense to the database
    const savedExpense = await expense.save();

    // Update user details
    user.expenses.push(savedExpense._id);
    user.totalExpense += amount;
    user.totalBalance -= amount;

    await user.save();

    res.status(201).json({
        success: true,
        message: "Expense created successfully",
        expense: savedExpense
    });
});

// const updateExpense = expressAsyncHandler(async (req, res) => {
//     const { title, amount, category, description, date } = req.body;
//     const { id } = req.params;
//     validateMongoDbId(id);

//     // Validate input
//     if (!title || !amount || !category) {
//         res.status(400);
//         throw new Error("Please add all required fields");
//     }

//     if (amount < 0) {
//         res.status(400);
//         throw new Error("Please enter a positive amount");
//     }

//     // Find the expense
//     const expense = await Expense.findById(id);
//     if (!expense) {
//         res.status(404);
//         throw new Error("Expense not found");
//     }

//     // Ensure the expense belongs to the user
//     if (expense.user.toString() !== req.user._id.toString()) {
//         res.status(403);
//         throw new Error("Not authorized to update this expense");
//     }

//     // Find the user
//     const user = await User.findById(req.user._id);
//     if (!user) {
//         res.status(404);
//         throw new Error("User not found");
//     }

//     // Check if the user’s balance is sufficient for the updated expense amount
//     const balanceImpact = amount - expense.amount; // Calculate the difference in amount
//     if (user.totalBalance < balanceImpact) {
//         res.status(400);
//         throw new Error("Insufficient balance");
//     }

//     // Update the expense
//     expense.title = title;
//     expense.amount = amount;
//     expense.category = category;
//     expense.description = description;
//     expense.date = date;

//     const updatedExpense = await expense.save();

//     // Update user details
//     user.totalExpense += (amount - expense.amount); // Adjust total expense
//     user.totalBalance -= (amount - expense.amount); // Adjust total balance

//     await user.save();

//     res.status(200).json({
//         success: true,
//         message: "Expense updated successfully",
//         expense: updatedExpense
//     });
// });

const updateExpense = expressAsyncHandler(async (req, res) => {
    const { title, amount, category, description, date, isRecurring, recurrenceInterval } = req.body;
    const { id } = req.params;
    validateMongoDbId(id);

    if (!title || !amount || !category) {
        res.status(400);
        throw new Error("Please add all required fields");
    }

    if (amount < 0) {
        res.status(400);
        throw new Error("Please enter a positive amount");
    }

    const expense = await Expense.findById(id);
    if (!expense) {
        res.status(404);
        throw new Error("Expense not found");
    }

    if (expense.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("Not authorized to update this expense");
    }

    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    const balanceImpact = amount - expense.amount; // Calculate the difference in amount
    if (user.totalBalance < balanceImpact) {
        res.status(400);
        throw new Error("Insufficient balance");
    }

    const expenseDate = date ? new Date(date) : expense.date;

    // Update the expense
    expense.title = title;
    expense.amount = amount;
    expense.category = category;
    expense.description = description;
    expense.date = expenseDate;
    expense.isRecurring = isRecurring || false;
    expense.recurrenceInterval = recurrenceInterval || null;
    expense.nextOccurrenceDate = isRecurring ? getNextOccurrenceDate(expenseDate, recurrenceInterval) : null;

    const updatedExpense = await expense.save();

    // Update user details
    user.totalExpense += (amount - expense.amount); // Adjust total expense
    user.totalBalance -= (amount - expense.amount); // Adjust total balance

    await user.save();

    res.status(200).json({
        success: true,
        message: "Expense updated successfully",
        expense: updatedExpense
    });
});

const deleteExpense = expressAsyncHandler(async (req,res)=>{
    const id = req.params.id;
    validateMongoDbId(id);
    const expense = await Expense.findById(id);
    if (!expense) { 
        res.status(404);
        throw new Error("Expense not found");
    }
    if (expense.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("Not authorized to delete this expense");
    }
    // remove the expense from user model and update the balances
    const user = await User.findById(req.user._id);
    user.expenses.pull(expense._id);
    user.totalExpense -= expense.amount;
    user.totalBalance += expense.amount;
    await user.save();
    await Expense.findByIdAndDelete(id);
    res.status(200).json({
        success: true,
        message: "Expense deleted successfully"
    });
});

const getExpense = expressAsyncHandler(async (req,res)=>{
    const id = req.params.id;
    validateMongoDbId(id);
    const expense = await Expense.findById(id);
    if (!expense) {
        res.status(404);
        throw new Error("Expense not found");
    }
    if(expense.user.toString() !== req.user._id.toString()){
        res.status(403);
        throw new Error("Not authorized to view this expense");
    }
    res.status(200).json({
        success: true,
        expense: expense
    });

});

const getAllExpenses = expressAsyncHandler(async (req,res)=>{
    const user = await User.findById(req.user._id);
    const expenses = await Expense.find({user: user._id}).sort({createdAt: -1
    });
    res.status(200).json({
        success: true,
        expenses: expenses
    });
});

module.exports = {
    createExpense,
    updateExpense,
    deleteExpense,
    getExpense,
    getAllExpenses
};
