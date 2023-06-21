const express = require("express")
const uuidv4 = require('uuid').v4
const rateLimiterMiddleware = require("./rateLimiterMemoryMiddleware")
const { validate } = require("uuid")

function makeApp (db, sessionsObject = {}) {
    const app = express()
    app.use(express.json())
    app.use("/helloWorld", rateLimiterMiddleware)

    const sessions = {...sessionsObject}

    app.get("/helloWorld", (req, res) => {
        res.json("Hello World!")
    })

    app.get("/api/shoppingCart", async (req, res) => {
        const { cookie } = req.headers

        if (sessionNotFound(cookie)) {
            const sessionToken = uuidv4()
            sessions[sessionToken] = {type: "anon"}
            const { shoppingCart, loginStatus } = await db.createAndReturnUser({sessionToken})
            res.cookie(sessionToken, { httpOnly: true, secure: true, sameSite: "lax" })
            return res.send({ shoppingCart, loginStatus })
        }
        
        const { shoppingCart, loginStatus } = await db.getUser(cookie)
        res.send({ shoppingCart, loginStatus })
    })

    app.post("/api/shoppingCart", async (req, res) => {
        const { cookie } = req.headers
        const { itemId, amount, params } = req.body

        if (typeof itemId !== "number" || itemId < 0 || itemId > 10000) {
            return res.status(400).send("No item to append!")
        }

        if (typeof amount !== "number" || amount <= 0 || amount > 100) {
            return res.status(400).send("Invalid amount")
        }

        if (!params || !params.color || !params.size) {
            return res.status(400).send("Invalid params")
        }

        let cartId = cookie
        if (sessionNotFound(cartId)) {
            cartId = uuidv4()
            sessions[cartId] = {type: "anon"}
            const person = await db.createAndReturnUser({sessionToken: cartId})
            res.cookie(cartId, { httpOnly: true, secure: true, sameSite: "lax" })
        }

        if (validateParams(params)) {
            if (itemIsInStock({ itemId, amount, params })) {
                await db.addToCart({ itemId, amount, params }, cartId)
            } else {
                return res.status(500).json("Not enough item in stock!")
            }
        } else {
            return res.status(400).json("Invalid parameters")
        }
        const { shoppingCart, loginStatus } = await db.getUser(cartId)
        res.send({ shoppingCart, loginStatus })
    })

    app.put("/api/shoppingCart", (req, res) => {
        const { cookie } = req.headers
        const { indexInCart, newAmount } = req.body

        if (typeof indexInCart !== "number") {
            return res.status(400).send("Invalid Index.")
        }
        
        if (typeof newAmount !== "number" || newAmount < 0 || newAmount > 100) {
            return res.status(400).send("Invalid new amount.")
        }
        
        if (sessionNotFound(cookie)) {
            return res.status(400).send("Invalid cookie")
        }
        
        const cartToModify = fetchShoppingCart(cookie).shoppingCart

        if (indexInCart < 0 || indexInCart >= cartToModify.length) {
            return res.status(400).send("Invalid index.")
        }

        const statusCode = editCart({indexInCart, newAmount, cartToModify})
        res.status(statusCode).send(fetchShoppingCart(cookie))
    })
    
    app.delete("/api/shoppingCart", (req, res) => {
        const { cookie } = req.headers
        const { indexInCart } = req.body

        if (typeof indexInCart !== "number") {
            return res.status(400).send("Invalid Index.")
        }
        
        if (sessionNotFound(cookie)) {
            return res.status(400).send("Invalid cookie")
        }
        
        const cartToModify = fetchShoppingCart(cookie).shoppingCart

        if (indexInCart < 0 || indexInCart >= cartToModify.length) {
            return res.status(400).send("Invalid index.")
        }

        const statusCode = deleteCartItem({indexInCart, cartToModify})
        res.status(statusCode).send(fetchShoppingCart(cookie))
    })

    function deleteCartItem(dataObject) {
        const { indexInCart, cartToModify } = dataObject

        cartToModify.splice(indexInCart, 1)
        return 200
    }

    function editCart(dataObject) {
        const { indexInCart, newAmount, cartToModify } = dataObject

        const itemId = cartToModify[indexInCart].itemId
        const amount = newAmount
        const item = { itemId, amount }

        if(itemIsInStock(item)) {
            cartToModify[indexInCart].amount = newAmount
            return 200
        } else {
            return 500
        }
    }

    function validateParams(params) {
        const { color, size } = params
        const allowedSizes = ["small", "medium", "large", "extraLarge"]
        const allowedColors = ["gray", "black", "white"]
        if(typeof size !== "string" || !allowedSizes.includes(size)) {
            return false
        }

        if(typeof color !== "string" || !allowedColors.includes(color)) {
            return false
        }

        return true
    }

    const stockDb = {
        1: 15
    }

    function getStock (itemId) {
        // TODO
        // Check stock of an item, of given config (ex: COLOR)

        return stockDb[itemId]
    }

    function itemIsInStock(object) {
        const amountInStock = getStock(object.itemId)
        if (object.amount > amountInStock) {
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
    
    return app
}

module.exports = makeApp