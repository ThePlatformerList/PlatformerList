const express = require("express")
const mongoose = require("mongoose")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const app = express()

mongoose.connect(process.env.MONGODB_URI, {
    dbName: "platformer",
    readPreference: "primaryPreferred",
    authSource: "$external",
    authMechanism: "MONGODB-X509",
    tlsCertificateKeyFile: process.env.keyPath,
})

app.use(express.json())
app.use(cors())
app.use(cookieParser())
app.use(express.urlencoded({
    extended: true
}))

app.use("/api", require("./routes/api"))
app.use("/authorize", require("./routes/authorize").app)

app.use(express.static("vueFiles"))

app.listen(process.env.PORT, async () => {
    console.log("Listening on port 3000")
    // let rec = await levels.create({
    //     position: 1,
    //     name: "LMFAO",
    //     ytcode: "zzzzzzzzzzz",
    //     creator: "Your mom",
    //     levelID: "128",
    //     verifier: "Your dad",
    //     records: [
    //         {
    //             name: "hpsk",
    //             link: "https://youtube.com",
    //             time: 24.128
    //         }
    //     ]
    // })
    // await leaderboard.create({
    //     name: "hpsk",
    //     records: [
    //         rec._id
    //     ]
    // })
})