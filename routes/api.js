const express = require("express")
const { default: mongoose, MongooseError } = require("mongoose")
const levelsSchema = require("../schemas/levels")
const authorizedSchema = require("../schemas/authorized")
const submissionsSchema = require("../schemas/submissions")
const {getUser} = require("./authorize")
const { ObjectId } = require("bson")
const app = express.Router()

async function authentication(req, res, next) {
    let user = await getUser(req, res)
    if(user.status) return res.status(user.status).json(user.body)
    let authorized = await authorizedSchema.exists({authorized: {$elemMatch: {$eq: user.id}}})
    if(authorized) return next()
    return res.status(401).json({error: "401 UNAUTHORIZED", message: `You are not allowed to ${req.method} to /api${req.path}.`})
}

async function createTransaction(cb, res) {
    let session = await mongoose.startSession()
    try {
        session.startTransaction()
        await cb(session)
        await session.commitTransaction()
        res.sendStatus(204)
    } catch (error) {
        if (error instanceof MongooseError && error.name.includes('UnknownTransactionCommitResult')) {
            res.status(500).json({ error: "500 INTERNAL SERVER ERROR", message: "Something went wrong. Please try again." })
        }
        else if (error instanceof MongooseError && error.name.includes('TransientTransactionError')) {
            res.status(500).json({ error: "500 INTERNAL SERVER ERROR", message: "Something went wrong. Please try again." })
        } else {
            res.status(400).json({ error: "400 BAD REQUEST", message: "An error may have occured in the process, rolling back information. Error:\n" + error })
        }
        await session.abortTransaction();
    } finally {
        await session.endSession()
    }
}

app.route("/levels")
.get(async (req, res) => {
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
.post(authentication, async (req, res) => {
    await createTransaction(async (session) => {
        let exists = await levelsSchema.exists({levelID: req.body.levelID})
        if(exists) throw new Error("A level with the same levelID already exists!")
        await levelsSchema.create([req.body], {session})
    }, res)
})
.patch(authentication, async (req, res) => {
    await createTransaction(async (session) => {
        let exists = await levelsSchema.findOne({_id: new ObjectId(req.body.id)}).select("position")
        if(!exists) throw new Error("Could not find the given level")
        if(req.body.update?.position) {
            await levelsSchema.updateMany({position: {$gte: Math.min(req.body.update.position, exists.position), $lte: Math.max(req.body.update.position, exists.position)}}, [{
                $set: {
                    $switch: {
                        branches: [
                            {case: {$gt: [exists.position, "$position"]}, then: {$add: ["$position", 1]}},
                            {case: {$lt: [exists.position, "$position"]}, then: {$subtract: ["$position", 1]}}
                        ],
                        default: req.body.update.position
                    }
                }
            }], {session})
        }
        await levelsSchema.updateOne({_id: new ObjectId(req.body.id)}, {
            $set: req.body.update
        }, {session, runValidators: true})
    }, res)
})
.delete(authentication, async (req, res) => {
    await createTransaction(async (session) => {
        let exists = await levelsSchema.exists({_id: new ObjectId(req.body.id)})
        if(!exists) throw new Error("Could not find the given Object ID")
        await levelsSchema.deleteOne({_id: new ObjectId(req.body.id)}, {session})
    }, res)
})

app.get("/levels/:levelID", async (req, res) => {
    const level = await levelsSchema.findOne({
        levelID: req.params.levelID
    })
    if(!level) return res.status(400).json({error: "400 BAD REQUEST", message: "That levelID does not exist in the database!"})
    res.json(level)
})

app.route("/submissions")
.get(authentication, async (req, res) => {
    let submissions = await submissionsSchema.aggregate([
        {
            $match: {status: req.query.archived ? {$ne: "pending"} : {$eq: "pending"}}
        },
            {
              '$lookup': {
                'from': 'levels', 
                'localField': 'levelID', 
                'foreignField': 'levelID', 
                'as': 'level'
              }
            }, {
              '$set': {
                'level': {
                  '$first': '$level'
                }
              }
            }, {
              '$project': {
                'name': 1, 
                'levelID': 1, 
                'link': 1,
                'raw': 1, 
                'time': 1, 
                'discord': 1, 
                'comments': 1,
                'status': 1, 
                'level': {
                  'position': '$level.position', 
                  'name': '$level.name', 
                  'ytcode': '$level.ytcode', 
                  'author': '$level.author'
                }
              }
            }
          ])
    let formatted_submissions = submissions.map(async e => {
        if(!e.level.name) {
            let re = await fetch(`https://gdbrowser.com/api/level/${e.levelID}`)
            let data = await re.json()
            e.level = {
                name: data.name,
                author: data.author
            }
        }
        return e
    })
    return res.json(await Promise.all(formatted_submissions))
})
.patch(authentication, async (req, res) => {
    await createTransaction(async (session) => {
        let submission = await submissionsSchema.findOne({_id: new ObjectId(req.body.id)})
        if(!submission) throw new Error("Could not find the given submission Object ID")
        if(req.body.status == "accepted") {
            await levelsSchema.updateOne({levelID: submission.levelID}, {
                $push: {
                    records: submission
                }
            }, {session})
        }
        await submissionsSchema.updateOne({_id: new ObjectId(req.body.id)}, {
            $set: {
                status: req.body.status
            }
        }, {session})
    }, res)
})

app.route("/submissions/@me")
.get(async (req, res) => {
    let user = await getUser(req, res)
    if(user.status) return res.status(user.status).json(user.body)
    let submissions = await submissionsSchema.aggregate([
        {
            $match: {status: req.query.archived ? {$ne: "pending"} : {$eq: "pending"}, discord: user.id}
        },
            {
              '$lookup': {
                'from': 'levels', 
                'localField': 'levelID', 
                'foreignField': 'levelID', 
                'as': 'level'
              }
            }, {
              '$set': {
                'level': {
                  '$first': '$level'
                }
              }
            }, {
              '$project': {
                'name': 1, 
                'levelID': 1, 
                'link': 1,
                'raw': 1, 
                'time': 1, 
                'discord': 1, 
                'comments': 1,
                'status': 1, 
                'level': {
                  'position': '$level.position', 
                  'name': '$level.name', 
                  'ytcode': '$level.ytcode', 
                  'author': '$level.author'
                }
              }
            }
          ])
    let formatted_submissions = submissions.map(async e => {
        if(!e.level.name) {
            let re = await fetch(`https://gdbrowser.com/api/level/${e.levelID}`)
            let data = await re.json()
            e.level = {
                name: data.name,
                author: data.author
            }
        }
        return e
    })
    return res.json(await Promise.all(formatted_submissions))
})
.patch(async (req, res) => {
    let user = await getUser(req, res)
    if(user.status) return res.status(user.status).json(user.body)
    await createTransaction(async (session) => {
        let submission = await submissionsSchema.findOne({_id: new ObjectId(req.body.id), discord: user.id})
        if(!submission) throw new Error("Could not find the given submission Object ID")
        await submissionsSchema.updateOne({_id: new ObjectId(req.body.id)}, {
          $set: {
            name: req.body.name || "$name",
            levelID: req.body.levelID || "$levelID",
            link: req.body.link || "$link",
            raw: req.body.raw || "$raw",
            time: req.body.time || "$time",
            comments: req.body.comments ?? ""
          }  
        }, {session, runValidators: true})
    }, res)
})
.post(async (req, res) => {
    let user = await getUser(req, res)
    if(user.status) return res.status(user.status).json(user.body)
    await createTransaction(async (session) => {
        await submissionsSchema.create([{...req.body, status: "pending", discord: user.id}], {session})
    }, res)
})
.delete(async (req, res) => {
    let user = await getUser(req, res)
    if(user.status) return res.status(user.status).json(user.body)
    await createTransaction(async (session) => {
        let submission = await submissionsSchema.findById(req.body.id)
        if(submission.status != "pending") throw new Error("You are not allowed to delete a record that isn't pending")
        await submissionsSchema.deleteOne({_id: new ObjectId(req.body.id)}, {session})
    }, res)
})

app.get("/user/:id", authentication, async (req, res) => {
    let request = await fetch(`https://discord.com/api/v10/users/${e}`, {headers: {authorization: `Bot ${process.env.BOT_TOKEN}`}})
    if(!request.ok) return res.status(400).json({error: "400 BAD REQUEST", message: `Not a valid discord user ID!`})
    let data = await request.json()
    return res.json(data)
})

app.get("/admin", authentication, async (req, res) => {
    res.sendStatus(200)
})

app.route("/admins")
.get(authentication, async (req, res) => {
    let admins = await authorizedSchema.findOne()
    let users = admins.authorized.map(async e => {
        let request = await fetch(`https://discord.com/api/v10/users/${e}`, {headers: {authorization: `Bot ${process.env.BOT_TOKEN}`}})
        let data = await request.json()
        return data
    })
    res.json(await Promise.all(users))
})
.post(authentication, async (req, res) => {
    await createTransaction(async (session) => {
        let exists = await authorizedSchema.exists({authorized: {$elemMatch: {$eq: req.body.id}}})
        if(exists) throw new Error("This user is already an admin!")
        await authorizedSchema.updateOne({}, {
            $push: {
                authorized: req.body.id
            }
        }, {session})
    }, res)
})
.delete(authentication, async (req, res) => {
    await createTransaction(async (session) => {
        let exists = await authorizedSchema.exists({authorized: {$elemMatch: {$eq: req.body.id}}})
        if(!exists) throw new Error("This user is not an admin!")
        await authorizedSchema.updateOne({}, {
            $pull: {
                authorized: req.body.id
            }
        }, {session})
    }, res)
})

app.all("*", (req, res) => {
    return res.status(404).json({error: "404 NOT FOUND", message: `Cannot ${req.method} to /api${req.path}`})
})

module.exports = app