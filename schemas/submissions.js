const mongoose = require("mongoose")

const submissionsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    level: {
        type: String,
        required: true
    },
    levelID: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: true
    },
    time: {
        type: Number,
        required: true
    },
    discord: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model("submissions", submissionsSchema)
