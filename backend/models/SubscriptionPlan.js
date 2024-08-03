const mongoose = require("mongoose");

const SubscriptionSchema = new mongoose.Schema({
    planName: {
        type: String,
        required: true,
        enum: ['free', 'basic', 'premium'] // Ensure these match with User model's plans
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    duration: {
        type: String,
        required: true,
        enum: ['monthly', 'yearly'] // Options for subscription duration
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("SubscriptionPlan", SubscriptionSchema);
