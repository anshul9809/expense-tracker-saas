const cron = require('node-cron');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const User = require('../models/User');

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

const scheduleRecurringIncomes = async () => {
    const now = new Date();
    const incomes = await Income.find({
        isRecurring: true,
        nextOccurrenceDate: { $lte: now }
    });

    for (const income of incomes) {
        const newIncome = new Income({
            title: income.title,
            amount: income.amount,
            category: income.category,
            description: income.description,
            date: now,
            user: income.user,
            isRecurring: income.isRecurring,
            recurrenceInterval: income.recurrenceInterval,
            nextOccurrenceDate: getNextOccurrenceDate(now, income.recurrenceInterval)
        });

        await newIncome.save();

        const user = await User.findById(income.user);
        user.incomes.push(newIncome._id);
        user.totalIncome += newIncome.amount;
        user.totalBalance += newIncome.amount; // Assuming balance increases with income
        user.totalSavings = user.totalBalance - user.totalExpense;

        await user.save();

        income.nextOccurrenceDate = getNextOccurrenceDate(now, income.recurrenceInterval);
        await income.save();
    }
};

cron.schedule('0 0 * * *', async () => {
    console.log('Running the recurring transactions scheduler...');
    try {
        await scheduleRecurringExpenses();
        await scheduleRecurringIncomes();
        console.log('Recurring transactions scheduling completed.');
    } catch (error) {
        console.error('Error scheduling recurring transactions:', error);
    }
});

module.exports = {
    scheduleRecurringExpenses,
    scheduleRecurringIncomes
};
