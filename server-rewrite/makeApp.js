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

        if (sessionNotFound(cookie)) {
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
        if (sessionNotFound(cartId)) {
            cartId = uuidv4()
            const newUserObject = newSessionWithCart()
            sessions[cartId] = newUserObject
            res.cookie(cartId)
        }

        const cartToModify = fetchShoppingCart(cartId).shoppingCart
        const statusCode = addToCart({itemId, amount, params}, cartToModify)
        res.status(statusCode).send(fetchShoppingCart(cartId))
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
        if (validateParams(object.params)) {
            if (itemIsInStock(object)) {
                cart.push(object)
                return 200
            } else {
                return 500
            }
        } else {
            return 400
        }
    }

    function itemIsInStock(object) {
        if (object.amount > 1) {
            return false
        }

        return true
    }

    function sessionNotFound (cookie) {
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