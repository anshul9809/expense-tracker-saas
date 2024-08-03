const expressAsyncHandler = require("express-async-handler");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const User = require("../models/User");

const getAllSubscriptionPlans = expressAsyncHandler(async (req,res)=>{
    const subscriptionPlans = await SubscriptionPlan.find();
    res.status(200).json(subscriptionPlans);
});

const getSingleSubscriptionPlan = expressAsyncHandler(async (req,res)=>{
    const {id} = req.params;
    validateMongoDbId(id);
    const subscriptionPlan = await SubscriptionPlan.findById(id);
    if(subscriptionPlan){
        res.status(200).json(subscriptionPlan);
    }
    else{
        res.status(404);
        throw new Error("Plan not found");
    }
});

const setUserSubscriptionPlan = expressAsyncHandler(async (req,res)=>{
    const {id} = req.params;
    validateMongoDbId(id);
    const subscriptionPlan = await SubscriptionPlan.findById(id);
    if(subscriptionPlan){
        const user = await User.findByIdAndUpdate(req.user._id, {subscriptionPlan:id}, {new:true}).populate("subscriptionPlan");
        res.status(200).json(user);
    }
    else{
        res.status(404);
        throw new Error("Plan not found");
    }
});

module.exports = {
    getAllSubscriptionPlans,
    getSingleSubscriptionPlan,
    setUserSubscriptionPlan
}