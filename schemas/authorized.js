const mongoose = require("mongoose")
const authorizedSchema = new mongoose.Schema({
    authorized: [String]
})

module.exports = mongoose.model("authorized", authorizedSchema)
