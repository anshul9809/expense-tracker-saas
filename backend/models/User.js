const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

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
        default: "https://res.cloudinary.com/dnu2n1uz0/image/upload/v1721911080/profile_pictures/66a21f318b36454ee92f5eba_1721911079353.png",
        required: true
    },
    avatarPublicId: {
        type: String
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
        zipcode: { type: String }
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
    twoFactorSecret: String,
    verified:{
        type:Boolean,
        default:false
    },
    verificationToken: String,
    verificationTokenExpires: Date,
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

UserSchema.methods.getPasswordResetToken = function(){
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.resetPasswordExpires = Date.now() + 30*60*1000;
    return resetToken;
}

module.exports = mongoose.model("User", UserSchema);
