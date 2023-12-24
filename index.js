const express = require("express")
const mongoose = require("mongoose")
const app = express()

mongoose.connect(process.env.MONGODB_URI, {
    dbName: "platformer",
    readPreference: "primaryPreferred",
    authSource: "$external",
    authMechanism: "MONGODB-X509",
    tlsCertificateKeyFile: process.env.keyPath,
})

app.use(express.static("vueFiles"))

app.listen(process.env.PORT, () => {
    console.log("Listening on port 3000")
})