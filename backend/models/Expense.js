const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true // To remove any unnecessary spaces
    },
    amount: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Food', 'Travel', 'Utilities', 'Entertainment', 'Healthcare', 'Education', 'Other'],
        default:"Other"
    },
    date: {
        type: Date,
        default: () => Date.now()
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    description: {
        type: String,
        maxlength: 500
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Expense", ExpenseSchema);
