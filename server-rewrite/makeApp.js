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
        const { itemId, amount, params } = req.body

        if (!itemId || typeof itemId !== "number") {
            return res.status(400).send("No item to append!")
        }

        if (!amount || typeof amount !== "number" || amount <= 0 || amount > 100) {
            return res.status(400).send("Invalid amount")
        }

        if (!params) {
            return res.status(400).send("Invalid params")
        }

        let cartId = cookie
        if (isNotCurrentCookie(cartId)) {
            cartId = uuidv4()
            const newSession = newSessionWithCart()
            sessions[cartId] = newSession
            res.cookie(cartId)
        }

        const cartToModify = fetchShoppingCart(cartId).shoppingCart
        if(!addToCart({itemId, amount, params}, cartToModify)) {
            res.status(400)
        }
        res.send(fetchShoppingCart(cartId))
    })

    function validateParams(params) {
        const { color, size } = params
        const allowedSizes = ["small", "medium", "large", "extraLarge"]
        const allowedColors = ["gray", "black", "white"]
        if(!color || typeof size !== "string" || !allowedSizes.includes(size)) {
            return false
        }

        if(!color || typeof color !== "string" || !allowedColors.includes(color)) {
            return false
        }

        return true
    }

    function addToCart(object, cart) {
        if(validateParams(object.params)) {
            cart.push(object)
        } else {
            return false
        }
    }

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