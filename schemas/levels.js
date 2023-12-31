const mongoose = require("mongoose")

const worldRecordSchema = new mongoose.Schema({
    name: {
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
    date: {
        type: Number,
        required: true
    }
})

const levelsSchema = new mongoose.Schema({
    position: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    ytcode: {
        type: String,
        required: true,
        validate: {
            validator: async v => {
                let exists = await fetch("https://youtube.com/watch?v="+v)
                return exists.ok
            },
            message: "Not a valid youtube video"
        }
    },
    verification: {
        type: String,
        required: true,
        validate: {
            validator: async v => {
                let exists = await fetch("https://youtube.com/watch?v="+v)
                return exists.ok
            },
            message: "Not a valid youtube video"
        }
    },
    creator: {
        type: [String],
        required: true
    },
    password: {
        type: String,
        required: false
    },
    levelID: {
        type: String,
        required: true,
        validate: {
            validator: async v => {
                let exists = await fetch(`https://gdbrowser.com/api/search/${v}?page=0&count=10`)
                return exists.ok
            },
            message: "Not a valid level ID!"
        }
    },
    verifier: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    records: {
        type: [worldRecordSchema],
        required: true
    }
})

module.exports = mongoose.model("levels", levelsSchema)
