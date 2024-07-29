const mongoose = require("mongoose");
const IncomeSchema = new mongoose.Schema({
    title:{
        type:String,
        trim:true,
        required:true,
    },
    amount:{
        type:Number,
        required:true,
        min:0
    },
    category:{
        type:String,
        required:true,
        default:"Other"
    },
    date:{
        type:Date,
        default:Date.now
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    description:{
        type:String,
        maxlength:500
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Income", IncomeSchema)