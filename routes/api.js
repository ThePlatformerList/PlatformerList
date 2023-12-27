const express = require("express")
const levelsSchema = require("../schemas/levels")
const app = express.Router()

app.get("/levels", async (req, res) => {
    /**
     * start?: number
     * end?: number
    */
    const levels = await levelsSchema.find({
        position: {
            $gte: parseInt(req.query.start) || 0,
            $lte: parseInt(req.query.end) || Infinity
        }
    })
    res.json(levels)
})

app.get("/levels/:levelID", async (req, res) => {
    const level = await levelsSchema.findOne({
        levelID: req.params.levelID
    })
    if(!level) return res.status(400).send({error: "400 BAD REQUEST", message: "That levelID does not exist in the database!"})
    res.json(level)
})

module.exports = app