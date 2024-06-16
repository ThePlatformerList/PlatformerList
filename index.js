const express = require("express")
const mongoose = require("mongoose")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const nocache = require("nocache")
const app = express()

mongoose.connect(process.env.MONGODB_URI, {
    dbName: "platformer",
    readPreference: "primaryPreferred"
})

app.use(nocache())
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
    console.log(`Listening on port ${process.env.PORT || 3000}`)
})