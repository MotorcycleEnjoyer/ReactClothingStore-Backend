const express = require("express")
const uuidv4 = require('uuid').v4
const rateLimiterMiddleware = require("./rateLimiterMemoryMiddleware")

function makeApp (database) {
    const app = express()
    app.use(express.json())
    app.use("/helloWorld", rateLimiterMiddleware)

    const sessions = {}

    app.get("/helloWorld", (req, res) => {
        res.json("Hello World!")
    })

    app.get("/api/shoppingCart", (req, res) => {
        const { cookie } = req.headers

        if(isNotCurrentCookie(cookie)) {
            const newCookie = uuidv4()
            sessions[newCookie] = {
                loginStatus: "anon",
                shoppingCart: []
            }

            res.cookie(newCookie)
            return res.send(fetchShoppingCart(newCookie))
        }
        
        res.send(fetchShoppingCart(cookie))
    })

    function isNotCurrentCookie (cookie) {
        return sessions[cookie] === undefined
    }

    function fetchShoppingCart (cookie) {
        return sessions[cookie]
    }

    return app
}

module.exports = makeApp