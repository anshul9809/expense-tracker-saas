const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true // To remove any unnecessary spaces
    },
    amount: {
        type: Number,
        required: true,
        min:0,
    },
    category: {
        type: String,
        required: true,
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
    },
    isRecurring:{
        type: Boolean,
        default:false
    },
    recurrenceInterval:{
        type:String,
        enum: ["daily", "weekly", "monthly"],
        default: "monthly"
    },
    nextOccurrenceDate: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Expense", ExpenseSchema);
