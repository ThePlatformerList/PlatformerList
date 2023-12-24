const mongoose = require("mongoose")

const worldRecordSchema = new mongoose.Schema({
    levelID: String,
    link: String,
    time: Number
})

const leaderboardSchema = new mongoose.Schema({
    name: String,
    records: [worldRecordSchema]
})

module.exports = mongoose.model("leaderboards", leaderboardSchema)