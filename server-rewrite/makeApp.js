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
        const { itemId, amount } = req.body

        if (!itemId || typeof itemId !== "number") {
            return res.status(400).send("No item to append!")
        }

        if (!amount || typeof amount !== "number" || amount <= 0 || amount > 100) {
            return res.status(400).send("Invalid amount")
        }

        if (isNotCurrentCookie(cookie)) {
            const newCookie = uuidv4()
            const newSession = {...newSessionWithCart(), shoppingCart: [{ itemId, amount }]}
            sessions[newCookie] = newSession
            res.cookie(newCookie)
            return res.send(fetchShoppingCart(newCookie))
        }

        console.log(cookie)
        const cartToModify = fetchShoppingCart(cookie).shoppingCart
        cartToModify.push({ itemId })
        res.send(fetchShoppingCart(cookie))
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