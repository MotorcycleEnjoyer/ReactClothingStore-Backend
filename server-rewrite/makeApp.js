const express = require("express")

function makeApp (database) {
    const app = express()
    app.use(express.json())

    app.get("/", (req, res) => {
        res.json("Hello World!")
    })

    app.get("/api/shoppingCart", (req, res) => {
        res.send({
            loginStatus: "anon",
            shoppingCart: []
        })
    })

    return app
}

module.exports = makeApp