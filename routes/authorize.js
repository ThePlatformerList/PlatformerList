const express = require("express")
const jwt = require("jsonwebtoken")
const app = express.Router()

async function getUser(req, res) {
    try {
        let { access_token, refresh_token, expires } = jwt.verify(req.cookies?.token || req.headers?.authorization, process.env.jwt_secret)
        if (!access_token) throw new Error()
        if (expires <= Date.now() / 1000) {
            let refreshed = await fetch("https://discord.com/api/v10/oauth2/token", {
                method: "POST",
                body: new URLSearchParams({
                    grant_type: "refresh_token",
                    refresh_token,
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET
                }),
                headers: {
                    'content-type': "application/x-www-form-urlencoded"
                }
            })
            let data = await refreshed.json()
            let token = jwt.sign({ access_token: data.access_token, refresh_token: data.refresh_token, expires: Date.now() / 1000 + data.expires_in }, process.env.jwt_secret)
            res.cookie("token", token)
            access_token = data.access_token
        }
        let user = await fetch("https://discord.com/api/v10/users/@me", {
            headers: {
                authorization: `Bearer ${access_token}`
            }
        })
        let userData = await user.json()
        return userData
    } catch (_) {
        return { body: {error: "400 BAD REQUEST", message: "Not a valid discord access token."}, status: 400 }
    }
}

app.get("/", async (req, res) => {
    let auth = await fetch("https://discord.com/api/v10/oauth2/token", {
        method: "POST",
        body: new URLSearchParams({
            grant_type: "authorization_code",
            code: req.query.code,
            redirect_uri: process.env.redirect,
            scope: 'identify',
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET
        }),
        headers: {
            'content-type': "application/x-www-form-urlencoded"
        }
    })
    if (!auth.ok) return res.status(400).send({ error: "400 BAD REQUEST", message: "Not a valid discord OAuth code" })
    let data = await auth.json()
    let token = jwt.sign({ access_token: data.access_token, refresh_token: data.refresh_token, expires: Date.now() / 1000 + data.expires_in }, process.env.jwt_secret)
    res.cookie("token", token)
    return res.redirect("/")
})

app.get("/flow", (req, res) => {
    return res.redirect(`https://discord.com/api/oauth2/authorize?client_id=1189655745654960190&response_type=code&redirect_uri=${process.env.redirect}&scope=identify`)
})

app.get("/revoke", async (req, res) => {
    const user = await getUser(req, res)
    if(user.status) return res.status(user.status).json(user.body)
    let { access_token } = jwt.verify(req.cookies?.token || req.headers?.authorization, process.env.jwt_secret)
    await fetch("https://discord.com/api/v10/oauth2/token/revoke", {
        method: "POST",
        body: new URLSearchParams({
            token: access_token,
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET
        }),
        headers: {
            'content-type': "application/x-www-form-urlencoded"
        }
    })
    res.clearCookie("token")
    res.redirect("/")
})

app.get("/@me", async (req, res) => {
    const user = await getUser(req, res)
    if(user.status) return res.status(user.status).json(user.body)
    return res.json(user)
})

app.all("*", (req, res) => {
    return res.status(404).json({error: "404 NOT FOUND", message: `Cannot ${req.method} to /authorize${req.path}`})
})

module.exports = {app, getUser}