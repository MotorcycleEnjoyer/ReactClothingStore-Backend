const express = require("express")
const uuidv4 = require('uuid').v4

function makeApp (database) {
    const app = express()
    app.use(express.json())

    app.get("/", (req, res) => {
        res.json("Hello World!")
    })

    app.get("/api/shoppingCart", (req, res) => {
        const { cookie } = req.headers

        if(!cookie) {
            const newCookie = uuidv4()
            res.cookie(newCookie)
        }
        
        res.send({
            loginStatus: "anon",
            shoppingCart: []
        })
    })

    return app
}

module.exports = makeApp