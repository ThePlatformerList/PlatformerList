const express = require("express")
const { default: mongoose, MongooseError } = require("mongoose")
const levelsSchema = require("../schemas/levels")
const authorizedSchema = require("../schemas/authorized")
const submissionsSchema = require("../schemas/submissions")
const {getUser} = require("./authorize")
const { ObjectId } = require("bson")
const app = express.Router()

let userTypes = ["mod", "admin", "owner"]

function authentication(type) {
    return async (req, res, next) => {
        let user = await getUser(req, res)
        if(user.status) return res.status(user.status).json(user.body)
        let authorized = await authorizedSchema.findOne({authorized: {$elemMatch: {id: {$eq: user.id}}}})
        if(authorized && userTypes.indexOf(authorized.authorized.find(e => e.id == user.id).type) >= userTypes.indexOf(type)) {
            req.perms = userTypes.indexOf(authorized.authorized.find(e => e.id == user.id).type)
            return next()
        }
        return res.status(401).json({error: "401 UNAUTHORIZED", message: `You are not allowed to ${req.method} to /api${req.path}.`})
    }
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
    }).sort({position: 1})
    res.json(levels)
})
.post(authentication("admin"), async (req, res) => {
    await createTransaction(async (session) => {
        let exists = await levelsSchema.exists({levelID: req.body.levelID})
        if(exists) throw new Error("A level with the same levelID already exists!")
        let documents = await levelsSchema.countDocuments()
        if(!Number.isInteger(req.body.position) || 0 >= req.body.position || documents+1 < req.body.position) throw new Error("Path 'position': Invalid range")
        delete req.body._id
        await levelsSchema.updateMany({position: {$gte: req.body.position}}, [{
            $set: {
                position: {
                    $add: ["$position", 1]
                }
            }
        }], {session})
        await levelsSchema.create([req.body], {session})
    }, res)
})
.patch(authentication("mod"), async (req, res) => {
    await createTransaction(async (session) => {
        let exists = await levelsSchema.findOne({_id: new ObjectId(req.body.id)})
        if(!exists) throw new Error("Could not find the given level")
        if(req.body.update?.records) {
            req.body.update.records.sort((a,b) => a.time - b.time)
            req.body.update.records.map(e => {
                e.date = exists.records.find(x => x.link == e.link)?.date || Date.now()
                return e
            })
        }
        if(req.perms < 1 && req.body.update.records) {
            await levelsSchema.updateOne({_id: new ObjectId(req.body.id)}, {
                $set: {
                    records: req.body.update.records
                }
            }, {session, runValidators: true})
            return;
        }
        if(req.body.update?.position && req.body.update.position != exists.position) {
            let documents = await levelsSchema.countDocuments()
            if(!Number.isInteger(req.body.update.position) || 0 >= req.body.update.position || documents < req.body.update.position) throw new Error("Path 'position': Invalid range")
            await levelsSchema.updateMany({position: {$gte: Math.min(req.body.update.position, exists.position), $lte: Math.max(req.body.update.position, exists.position)}}, [{
                $set: {
                    position: {
                        $switch: {
                            branches: [
                                {case: {$gt: [exists.position, "$position"]}, then: {$add: ["$position", 1]}},
                                {case: {$lt: [exists.position, "$position"]}, then: {$subtract: ["$position", 1]}}
                            ],
                            default: req.body.update.position
                        }
                    }
                }
            }], {session})
        }
        await levelsSchema.updateOne({_id: new ObjectId(req.body.id)}, {
            $set: req.body.update
        }, {session, runValidators: true})
    }, res)
})
.delete(authentication("admin"), async (req, res) => {
    await createTransaction(async (session) => {
        let exists = await levelsSchema.findOne({_id: new ObjectId(req.body.id)})
        if(!exists) throw new Error("Could not find the given Object ID")
        await levelsSchema.updateMany({position: {$gt: exists.position}}, [{
            $set: {
                position: {
                    $subtract: ["$position", 1]
                }
            }
        }], {session})
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
.get(authentication("mod"), async (req, res) => {
    let user = await getUser(req, res)
    if(user.status) return res.status(user.status).json(user.body)
    let submissions = await submissionsSchema.aggregate([
        {
            $match: {status: req.query.archived ? {$ne: "pending"} : {$eq: "pending"}, discord: {$ne: user.id}}
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
                'date': 1, 
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
                  'ytcode': '$level.verification', 
                  'author': '$level.author'
                }
              }
            },
            {
                '$sort': {
                    'date': 1
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
.patch(authentication("mod"), async (req, res) => {
    await createTransaction(async (session) => {
        let user = await getUser(req, res)
        if(user.status) return res.status(user.status).json(user.body)
        let submission = await submissionsSchema.exists({_id: new ObjectId(req.body.id), discord: {$ne: user.id}})
        if(!submission) throw new Error("Could not find the given submission Object ID")
        if(req.body.status == "accepted" && !req.body.verification) {
            await levelsSchema.updateOne({levelID: req.body.levelID}, [{
                $set: {
                    records: {
                        $concatArrays: [
                            {
                               $filter: {
                                input: "$records",
                                cond: {
                                    $ne: ["$$this.name", req.body.name]
                                }
                               }
                            },
                            [{
                                name: req.body.name,
                                link: req.body.link,
                                time: req.body.time,
                                date: Date.now(),
                                _id: new ObjectId(req.body._id)
                            }]
                        ]
                    }
                }
            }], {session})
        }
        await submissionsSchema.updateOne({_id: new ObjectId(req.body.id)}, {
            $set: req.body
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
                'date': 1, 
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
                  'ytcode': '$level.verification', 
                  'author': '$level.author'
                }
              }
            },
            {
                '$sort': {
                    'date': 1
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
        if(submission.status != "pending") throw new Error("You are not allowed to edit a record that isn't pending")
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
    let exists = await submissionsSchema.exists({name: req.body.name, levelID: req.body.levelID})
    if(exists) return res.status(400).json({error: "400 BAD REQUEST", message: "This submission already exists in the database!"})
    await createTransaction(async (session) => {
        await submissionsSchema.create([{...req.body, status: "pending", discord: user.id, date: Date.now()}], {session})
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

app.get("/user/:id", authentication("admin"), async (req, res) => {
    let request = await fetch(`https://discord.com/api/v10/users/${req.params.id}`, {headers: {authorization: `Bot ${process.env.BOT_TOKEN}`}})
    if(!request.ok) return res.status(400).json({error: "400 BAD REQUEST", message: `Not a valid discord user ID!`})
    let data = await request.json()
    return res.json(data)
})

app.get("/admin", authentication("mod"), async (req, res) => {
    let user = await getUser(req, res)
    if(user.status) return res.status(user.status).json(user.body)
    let databaseUser = await authorizedSchema.findOne({authorized: {$elemMatch: {id: {$eq: user.id}}}})
    res.status(200).send({type: userTypes.indexOf(databaseUser.authorized.find(e => e.id == user.id).type)})
})

app.route("/admins")
.get(authentication("admin"), async (req, res) => {
    let admins = await authorizedSchema.findOne()
    let users = admins.authorized.map(async e => {
        let request = await fetch(`https://discord.com/api/v10/users/${e.id}`, {headers: {authorization: `Bot ${process.env.BOT_TOKEN}`}})
        let data = await request.json()
        return {
            ...data,
            type: e.type,
            typeEnum: userTypes.findIndex(x => x == e.type)
        }
    })
    res.json((await Promise.all(users)).sort((a,b) => b.typeEnum - a.typeEnum))
})
.post(async (req, res, next) => {
    await createTransaction(async (session) => {
        let exists = await authorizedSchema.exists({authorized: {$elemMatch: {id: {$eq: req.body.id}}}})
        if(exists) throw new Error("This user already exists!")
        let user = await getUser(req, res)
            if(user.status) return res.status(user.status).json(user.body)
            let authorized = await authorizedSchema.findOne({authorized: {$elemMatch: {id: {$eq: user.id}}}})
            if(userTypes.indexOf(authorized?.authorized?.find(e => e?.id == user?.id)?.type) != userTypes.length-1) {
                if(!authorized || userTypes.indexOf(authorized.authorized.find(e => e.id == user.id).type) <= userTypes.indexOf(req.body.type)) throw new Error(`You are not allowed to add a user that is ${req.body.type}.`)
            }
        await authorizedSchema.updateOne({}, {
            $push: {
                authorized: req.body
            }
        }, {session})
    }, res)
})
.patch(async (req, res, next) => {
    if(!userTypes.includes(req.body.type)) throw new Error("Invalid type")
    await createTransaction(async (session) => {
        let exists = await authorizedSchema.findOne({authorized: {$elemMatch: {id: {$eq: req.body.id}}}})
    if(!exists) throw new Error("This user does not exist!")
    let otherUser = exists.authorized.find(e => e.id == req.body.id).type
    let user = await getUser(req, res)
        if(user.status) return res.status(user.status).json(user.body)
        let authorized = await authorizedSchema.findOne({authorized: {$elemMatch: {id: {$eq: user.id}}}})
        if(userTypes.indexOf(authorized?.authorized?.find(e => e?.id == user?.id)?.type) != userTypes.length-1) {
            if(!authorized || userTypes.indexOf(authorized.authorized.find(e => e.id == user.id).type) <= userTypes.indexOf(req.body.type) || userTypes.indexOf(authorized.authorized.find(e => e.id == user.id).type) <= userTypes.indexOf(otherUser)) throw new Error(`You are not allowed to edit this user to ${req.body.type}.`)
        }
        await authorizedSchema.updateOne({}, [
            {
              $set: {
                "authorized": {
                  $concatArrays: [
                    {
                      $filter: {
                        input: "$authorized",
                        cond: { $ne: ["$$this.id", req.body.id] },
                      },
                    },
                    [{
                        id: req.body.id,
                        type: req.body.type
                    }],
                  ],
                },
              },
            },
          ], {session, runValidators: true})
    }, res)
})
.delete(async (req, res, next) => {
    await createTransaction(async (session) => {
        let exists = await authorizedSchema.findOne({authorized: {$elemMatch: {id: {$eq: req.body.id}}}})
    if(!exists) throw new Error("This user does not exist!")
    let otherUser = exists.authorized.find(e => e.id == req.body.id).type
    let user = await getUser(req, res)
        if(user.status) return res.status(user.status).json(user.body)
        let authorized = await authorizedSchema.findOne({authorized: {$elemMatch: {id: {$eq: user.id}}}})
        if(userTypes.indexOf(authorized?.authorized?.find(e => e?.id == user?.id)?.type) != userTypes.length-1) {
            if(!authorized || userTypes.indexOf(authorized.authorized.find(e => e.id == user.id).type) <= userTypes.indexOf(otherUser)) throw new Error(`You are not allowed to edit this user to ${req.body.type}.`)
        }
        await authorizedSchema.updateOne({}, {
            $pull: {
                authorized: {
                    id: {
                        $eq: req.body.id
                    }
                }
            }
        }, {session})
    }, res)
})

app.all("*", (req, res) => {
    return res.status(404).json({error: "404 NOT FOUND", message: `Cannot ${req.method} to /api${req.path}`})
})

module.exports = app