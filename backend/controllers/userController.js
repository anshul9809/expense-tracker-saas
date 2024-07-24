const expressAsyncHandler = require("express-async-handler");
const User = require("../models/User");
const bcrypt = require("bcrypt");


const register = expressAsyncHandler(async (req,res)=>{
    const {name, email, password} = req.body;

    if(!name || !email || !password){
        res.status(400);
        throw new Error("Please add all fields");
    }
});


module.exports = {
    register
};