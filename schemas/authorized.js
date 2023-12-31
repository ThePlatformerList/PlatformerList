const mongoose = require("mongoose")
const userSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
})
const authorizedSchema = new mongoose.Schema({
    authorized: [userSchema]
})

module.exports = mongoose.model("authorized", authorizedSchema)
