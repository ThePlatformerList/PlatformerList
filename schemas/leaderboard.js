const mongoose = require("mongoose")

const leaderboardSchema = new mongoose.Schema({
    name: String,
    records: [mongoose.Types.ObjectId]
})

module.exports = mongoose.model("leaderboards", leaderboardSchema)
