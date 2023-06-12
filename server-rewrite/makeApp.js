const express = require("express")
const uuidv4 = require('uuid').v4
const rateLimiterMiddleware = require("./rateLimiterMemoryMiddleware")

function makeApp (database, sessionsObject = {}) {
    const app = express()
    app.use(express.json())
    app.use("/helloWorld", rateLimiterMiddleware)

    const sessions = {...sessionsObject}

    app.get("/helloWorld", (req, res) => {
        res.json("Hello World!")
    })

    app.get("/api/shoppingCart", (req, res) => {
        const { cookie } = req.headers

        if (isNotCurrentCookie(cookie)) {
            const newCookie = uuidv4()
            sessions[newCookie] = newSessionWithCart()
            res.cookie(newCookie)
            return res.send(fetchShoppingCart(newCookie))
        }
        
        res.send(fetchShoppingCart(cookie))
    })

    app.post("/api/shoppingCart", (req, res) => {
        const { cookie } = req.headers
        const { itemId } = req.body

        if (isNotCurrentCookie(cookie)) {
            const newCookie = uuidv4()
            const newSession = {...newSessionWithCart(), shoppingCart: [{ itemId }]}
            sessions[newCookie] = newSession
            res.cookie(newCookie)
            return res.send(fetchShoppingCart(newCookie))
        }


    })

    function isNotCurrentCookie (cookie) {
        return sessions[cookie] === undefined
    }

    function fetchShoppingCart (cookie) {
        return sessions[cookie]
    }

    function newSessionWithCart () {
        return {
            loginStatus: "anon",
            shoppingCart: []
        }
    }

    return app
}

module.exports = makeApp