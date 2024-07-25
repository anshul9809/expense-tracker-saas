const expressAsyncHandler = require("express-async-handler");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const {generateToken} = require("../config/jwtToken");


const register = expressAsyncHandler(async (req,res)=>{
    const {name, email, password} = req.body;

    if(!name || !email || !password){
        res.status(400);
        throw new Error("Please add all fields");
    }

    try{
        const existedUser = await User.findOne({email});

        if(existedUser){
            res.status(400);
            throw new Error("User already exists");
        }
        const user = await User.create({
            name,
            email,
            password
        });
        if(user){
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
                avatar: user.avatar
            });
        }
        else{
            res.status(400);
            throw new Error("Something went wrong");
        }
    }
    catch(err){
        console.log(err);
        res.status(400);
        throw new Error(err? err.message: "Something went wrong, please try again");   
    }
});

const login = expressAsyncHandler(async (req,res)=>{
    const {email, password} = req.body;

    if(!email || !password){
        res.status(400);
        throw new Error("Please add all fields");
    }

    const user = await User.findOne({email});

    if(user && (await user.isPasswordMatched(password))){
        const token = generateToken(user._id)
        res.cookie("token", token , {
            httpOnly: true,
            sameSite: "none",
            // secure: true
        });
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: token,
            avatar: user.avatar
        });
    }
    else{
        res.status(401);
        throw new Error("Invalid email or password");
    }

});

const logout = expressAsyncHandler(async (req,res)=>{
    res.cookie("token", null, {
        httpOnly: true,
        expires: new Date(0),
        sameSite: "none",
        // secure: true
    });

    res.status(200).json({success: true, message: "Logged out successfully"});

});

const getUserProfile = expressAsyncHandler(async (req,res)=>{

    const user = await User.findById(req.user._id);

    if(user){
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar
        });
    }
    else{
        res.status(404);
        throw new Error("User not found");
    }

});

const updateUserProfile = expressAsyncHandler(async (req,res)=>{

    const user = await User.findById(req.user._id);
    if(!user){
        res.status(404);
        throw new Error("User not found");
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if(req.body.password){
        user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.status(200).json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        token: generateToken(updatedUser._id),
        avatar: updatedUser.avatar
    });

});

const updatePassword = expressAsyncHandler(async (req,res)=>{

    const user = await User.findById(req.user._id);

    if(!user){
        res.status(404);
        throw new Error("User not found");
    }

    if(req.body.password !== req.body.confirmPassword){
        res.status(400);
        throw new Error("Passwords do not match");
    }

    const isPasswordMatched = await user.isPasswordMatched(req.body.oldPassword);

    if(!isPasswordMatched){
        res.status(400);
        throw new Error("Old password is incorrect");
    }

    user.password = req.body.password;

    const updatedUser = await user.save();

    res.status(200).json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        token: generateToken(updatedUser._id),
        avatar: updatedUser.avatar
    });
})


module.exports = {
    register,
    login,
    logout,
    getUserProfile,
    updateUserProfile,
    updatePassword
};