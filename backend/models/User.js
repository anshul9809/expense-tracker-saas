const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
    name: String,
    email: String,
    password: String,
    avatar: String,
    //create a field of role with default as user
    role: {
        type: String,
        default: "user"
    }
    
},{
    timestamps:true
});


UserSchema.pre("save", async function (next) {
    const user = this;
    // Only hash the password if it's modified
    if (!user.isModified('password')){
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        user.password = hashedPassword;
        next();
    }catch (error) {
        return next(error);
    }
});

UserSchema.methods.isPasswordMatched = async function (enteredPassword){
    if (!this.password) {
        throw new Error("Password is not defined");
    }
    return await bcrypt.compare(enteredPassword, this.password);
}

module.exports = mongoose.model("User", UserSchema);