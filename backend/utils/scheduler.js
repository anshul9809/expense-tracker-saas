const cron = require("node-cron");
const Expense = require("../models/Expense");
const User = require("../models/User");

const getNextOccurrenceDate = (date, interval) => {
    const nextDate = new Date(date);

    if (interval === 'daily') nextDate.setDate(nextDate.getDate() + 1);
    if (interval === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
    if (interval === 'monthly') {
        nextDate.setMonth(nextDate.getMonth() + 1);
        if (date.getDate() > 28) {
            nextDate.setDate(0);
        } else {
            nextDate.setDate(date.getDate());
        }
    }

    return nextDate;
};

const scheduleRecurringExpenses = async () => {
    const now = new Date();
    const expenses = await Expense.find({
        isRecurring: true,
        nextOccurrenceDate: { $lte: now }
    });

    for (const expense of expenses) {
        const newExpense = new Expense({
            title: expense.title,
            amount: expense.amount,
            category: expense.category,
            description: expense.description,
            date: now,
            user: expense.user,
            isRecurring: expense.isRecurring,
            recurrenceInterval: expense.recurrenceInterval,
            nextOccurrenceDate: getNextOccurrenceDate(now, expense.recurrenceInterval)
        });

        await newExpense.save();

        const user = await User.findById(expense.user);
        user.expenses.push(newExpense._id);
        user.totalExpense += newExpense.amount;
        user.totalBalance -= newExpense.amount;

        await user.save();

        expense.nextOccurrenceDate = getNextOccurrenceDate(now, expense.recurrenceInterval);
        await expense.save();
    }
};

cron.schedule('0 0 * * *', () => {
    console.log("Running the recurring expenses scheduler...");
    scheduleRecurringExpenses().catch(error => console.error("Error scheduling recurring expenses:", error));
});
