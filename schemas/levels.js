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
        required: false,
        validate: {
            validator: async v => {
                if(!v) return true;
                let exists = await fetch(`https://img.youtube.com/vi/${v}/mqdefault.jpg`)
                return exists.ok
            },
            message: "Not a valid YT Code"
        }
    },
    verification: {
        type: String,
        required: true,
        validate: {
            validator: async v => {
                let exists = await fetch(`https://img.youtube.com/vi/${v}/mqdefault.jpg`)
                return exists.ok
            },
            message: "Not a valid YT Code"
        }
    },
    creator: {
        type: [String],
        required: true
    },
    password: {
        type: String,
        required: true
    },
    verifierTime: {
        type: Number,
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
