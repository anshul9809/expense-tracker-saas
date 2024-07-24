const mongoose = require("mongoose");
module.exports.validateMongodbId = (id)=>{
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("This MongoDB ID is not valid");
    }
}