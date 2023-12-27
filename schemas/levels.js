const mongoose = require("mongoose")

const worldRecordSchema = new mongoose.Schema({
    name: String,
    link: String,
    time: Number
})

const levelsSchema = new mongoose.Schema({
    position: Number,
    name: String,
    ytcode: String,
    verification: String,
    creator: [String],
    password: String,
    levelID: String,
    verifier: String,
    author: String,
    records: [worldRecordSchema]
})

module.exports = mongoose.model("levels", levelsSchema)
