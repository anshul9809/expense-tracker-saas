const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const expressAsyncHandler = require("express-async-handler");
const {validateMongoDbId} = require("../utils/validateMongoDbId");

//functions for admin profile
const login = expressAsyncHandler(async (req,res)=>{
    const {email, password} = req.body;
    const user = await User.findOne({email});
    if(user && (await bcrypt.compare(password, user.password))){
        if(user.role !== "admin"){
            res.status(401);
            throw new Error("Not authorized as an admin");
        }
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: "1d"});
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "none",
            secure: true
        });
        const {password, ...others} = user._doc;
        res.status(200).json({...others});
    }
    else{
        res.status(401);
        throw new Error("Invalid email or password");
    }
});

const getAdminProfile = expressAsyncHandler(async (req,res)=>{
    validateMongoDbId(req.user._id);
    const user = await User.findById(req.user._id);
    if(user){
        res.json(user);
    }
    else{
        res.status(404);
        throw new Error("User not found");
    }
});

const updateAdminProfile = expressAsyncHandler(async (req, res) => {
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

const logout = expressAsyncHandler(async (req,res)=>{
    res.clearCookie("token");
    res.status(200).json("Logged out successfully");
});


//admin rights functionality
const getAllUsers = expressAsyncHandler(async (req,res)=>{
    const users = await User.find();
    res.json(users);
});

const getUser = expressAsyncHandler(async (req,res)=>{
    const {id} = req.params;
    validateMongoDbId(id);
    const user = await User.findById(id);
    if(user){
        res.json(user);
    }
    else{
        res.status(404);
        throw new Error("User not found");
    }
});

const changeUserStatus = expressAsyncHandler(async (req,res)=>{
    const {id} = req.params;
    validateMongoDbId(id);
    const user = await User.findById(id);
    if(user){
        user.status = req.body.status;
        await user.save();
        res.json(user);
    }
    else{
        res.status(404);
        throw new Error("User not found");
    }
});

const deleteUser = expressAsyncHandler(async (req,res)=>{
    const {id} = req.params;
    validateMongoDbId(id);
    const user = await User.findByIdAndDelete(id);
    if(user){
        res.json(user);
    }
    else{
        res.status(404);
        throw new Error("User not found");
    }
});





module.exports = {
    getAllUsers,
    getUser,
    login,
    logout,
    updateAdminProfile,
    getAdminProfile,
    changeUserStatus,
    deleteUser
    
}