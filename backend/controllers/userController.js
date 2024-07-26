const expressAsyncHandler = require("express-async-handler");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const {generateToken} = require("../config/jwtToken"); 
const cloudinary = require("cloudinary").v2;
const { validateMongoDbId } = require("../utils/validateMongoDbId");
// Generate Token


const sendVerificationEmail = expressAsyncHandler(async (user)=>{
    const verificationToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    // Save verification token to the user record
    user.verificationToken = verificationToken;
    await user.save();

    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

    const message = `Thank you for registering. Please verify your email by clicking the following link: \n\n ${verificationUrl}`;

    await sendEmail({
        email: user.email,
        subject: "Email Verification",
        message,
    });

});

// Register User
const register = expressAsyncHandler(async (req, res) => {
    const { name, email, password} = req.body;

    // Ensure all required fields are provided
    if (!name || !email || !password) {
        res.status(400);
        throw new Error("Please add all required fields");
    }

    try {
        // Check if user already exists
        const existedUser = await User.findOne({ email });

        if (existedUser) {
            res.status(400);
            throw new Error("User already exists");
        }

        // Create a new user
        const user = await User.create(req.body);

        // If user creation is successful, send verification email
        if (user) {
            await sendVerificationEmail(user);
            const token = await generateToken(user._id);

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: token,
                avatar: user.avatar,
                phone: user.phone,
                address: user.address,
                dateOfBirth: user.dateOfBirth,
                status: user.status,
                subscriptionPlan: user.subscriptionPlan,
                preferences: user.preferences,
                is2FAEnabled: user.is2FAEnabled,
                verified: user.verified,
                message: "Registration successful, please check your email for verification link"
            });
        } else {
            res.status(400);
            throw new Error("Something went wrong during user creation");
        }
    } catch (err) {
        res.status(400);
        throw new Error(err ? err.message : "Something went wrong, please try again");
    }
});
//tested

// Login User
const login = expressAsyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error("Please add all fields");
    }

    const user = await User.findOne({ email });

    if (user && (await user.isPasswordMatched(password))) {
        const token = await generateToken(user._id);
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "none",
            secure: true,
        });
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: token,
            avatar: user.avatar,
            phone: user.phone,
            address: user.address,
            dateOfBirth: user.dateOfBirth,
            status: user.status,
            subscriptionPlan: user.subscriptionPlan,
            preferences: user.preferences,
            is2FAEnabled: user.is2FAEnabled,
        });
    } else {
        res.status(401);
        throw new Error("Invalid email or password");
    }
});
//tested

// Logout User
const logout = expressAsyncHandler(async (req, res) => {
    res.cookie("token", null, {
        httpOnly: true,
        expires: new Date(0),
        sameSite: "none",
        secure: true,
    });

    res.status(200).json({ success: true, message: "Logged out successfully" });
});
//tested

// Get User Profile
const getUserProfile = expressAsyncHandler(async (req, res) => {
    validateMongoDbId(req.user._id);
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }
    else{
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            phone: user.phone,
            address: user.address,
            dateOfBirth: user.dateOfBirth,
            status: user.status,
            subscriptionPlan: user.subscriptionPlan,
            preferences: user.preferences,
            verified: user.verified,
            is2FAEnabled: user.is2FAEnabled,
        });
    }
});
//tested

// Update User Profile
const updateUserProfile = expressAsyncHandler(async (req, res) => {
    validateMongoDbId(req.user._id);
    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;

    if (req.body.address) {
        user.address.street = req.body.address.street || user.address.street;
        user.address.city = req.body.address.city || user.address.city;
        user.address.state = req.body.address.state || user.address.state;
        user.address.zipcode = req.body.address.zipcode || user.address.zipcode;
    }

    user.dateOfBirth = req.body.dateOfBirth || user.dateOfBirth;
    user.preferences = req.body.preferences || user.preferences;

    if (req.body.password) {
        user.password = req.body.password;
    }

    if (req.file) {
        // Delete the old avatar from Cloudinary if it exists
        if (user.avatarPublicId) {
            await cloudinary.uploader.destroy(user.avatarPublicId);
        }
        // Save the new avatar URL and public ID
        user.avatar = req.file.path;
        user.avatarPublicId = req.file.filename;
    }

    const updatedUser = await user.save();

    res.status(200).json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        token: generateToken(updatedUser._id),
        avatar: updatedUser.avatar,
        phone: updatedUser.phone,
        address: updatedUser.address,
        dateOfBirth: updatedUser.dateOfBirth,
        status: updatedUser.status,
        subscriptionPlan: updatedUser.subscriptionPlan,
        preferences: updatedUser.preferences,
        is2FAEnabled: updatedUser.is2FAEnabled,
        message:"Profile Updated"
    });
});
//tested

// Update Password
const updatePassword = expressAsyncHandler(async (req, res) => {
    validateMongoDbId(req.user._id);
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }
    
    if (req.body.password !== req.body.confirmPassword) {
        res.status(401);
        throw new Error("Passwords do not match");
    }
    
    const isPasswordMatched = await user.isPasswordMatched(req.body.oldPassword);
    
    if (!isPasswordMatched) {
        res.status(402);
        throw new Error("Old password is incorrect");
    }
    
    const isPasswordSame = await user.isPasswordMatched(req.body.password);
    if(isPasswordSame){
        res.status(403);
        throw new Error("New password can't be same as old password");
    }
    
    user.password = req.body.password;
    
    const updatedUser = await user.save();
    
    res.status(200).json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        phone: updatedUser.phone,
        address: updatedUser.address,
        dateOfBirth: updatedUser.dateOfBirth,
        status: updatedUser.status,
        subscriptionPlan: updatedUser.subscriptionPlan,
        preferences: updatedUser.preferences,
        is2FAEnabled: updatedUser.is2FAEnabled,
        message:"Password Updated successfully"
    });
});
//tested

// Forgot Password
const forgotPassword = expressAsyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    const resetToken = user.getPasswordResetToken();
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/resetPassword/${resetToken}`;

    const message = `You requested a password reset. Please go to this link to reset your password: \n\n ${resetUrl}`;

    try {
        await sendEmail({
            email: user.email,
            subject: "Password Reset Request",
            message,
        });

        res.status(200).json({ success: true, message: "Email sent" });
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(500);
        throw new Error("Email could not be sent");
    }
});
//tested

// Reset Password
const resetPassword = expressAsyncHandler(async (req, res) => {
    const resetPasswordToken = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex");
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpires: { $gt: Date.now() },
    });
    const {password} = req.body;
    if (!user) {
        res.status(400);        
        throw new Error("Invalid token");
    }

    if (password !== req.body.confirmPassword) {
        res.status(400);
        throw new Error("Passwords do not match");
    }
    const passwordSameAsOld = await user.isPasswordMatched(password);
    if(passwordSameAsOld){
        res.status(400);
        throw new Error("old and new password can't be same");
    }
    
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();

    res.status(200).json({ success: true, message: "Password reset successful" });
});
//tested

// Email Verification
const verifyEmail = expressAsyncHandler(async (req, res) => {
    const verificationToken = req.params.token;

    const user = await User.findOne({ verificationToken });

    if (!user) {
        res.status(400);
        throw new Error("Invalid or expired token");
    }

    user.verified = true;
    user.verificationToken = undefined;

    await user.save();

    res.status(200).json({ success: true, message: "Email verified successfully" });
});
//tested


module.exports = {
    register,
    login,
    logout,
    getUserProfile,
    updateUserProfile,
    updatePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
};
