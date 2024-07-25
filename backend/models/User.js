const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please fill a valid email address'
        ]
    },
    password: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        default: "https://example.com/path-to-default-avatar.png",
        required: true
    },
    role: {
        type: String,
        default: "user"
    },
    phone: {
        type: String,
        match: [/^\d{10}$/, 'Please fill a valid phone number']
    },
    address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        zip: { type: String }
    },
    dateOfBirth: {
        type: Date
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'banned'],
        default: 'active'
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    subscriptionPlan: {
        type: String,
        enum: ['free', 'basic', 'premium'],
        default: 'free'
    },
    preferences: {
        type: Map,
        of: String,
        default: {}
    },
    is2FAEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: String
}, {
    timestamps: true
});

UserSchema.pre("save", async function (next) {
    const user = this;
    if (!user.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        next();
    } catch (error) {
        return next(error);
    }
});

UserSchema.methods.isPasswordMatched = async function (enteredPassword) {
    if (!this.password) {
        throw new Error("Password is not defined");
    }
    return await bcrypt.compare(enteredPassword, this.password);
}

module.exports = mongoose.model("User", UserSchema);
