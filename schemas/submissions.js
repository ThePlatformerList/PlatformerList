const mongoose = require("mongoose")

const submissionsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
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
    link: {
        type: String,
        required: true,
        validate: {
            validator: async v => {
                let exists = await fetch(v)
                return exists.ok
            },
            message: "Not a valid youtube video"
        }
    },
    raw: {
        type: String,
        required: true,
        validate: {
            validator: async v => {
                let exists = await fetch(v)
                return exists.ok
            },
            message: "Not a valid youtube video"
        }
    },
    time: {
        type: Number,
        required: true
    },
    discord: {
        type: String,
        required: true
    },
    comments: {
        type: String,
        required: false
    },
    status: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model("submissions", submissionsSchema)
