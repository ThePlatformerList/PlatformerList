const mongoose = require("mongoose")

const worldRecordSchema = new mongoose.Schema({
    name: String,
    link: String,
    time: Number
})

const levelsSchema = new mongoose.Schema({
    position: Number,
    name: String,
    creator: String,
    levelID: String,
    verifier: String,
    worldRecord: [worldRecordSchema]
})

module.exports = mongoose.model("levels", levelsSchema)