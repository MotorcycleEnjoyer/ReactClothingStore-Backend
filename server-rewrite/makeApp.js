const express = require("express")

function makeApp (database) {
    const app = express()
    app.use(express.json())

    app.get("/", (req, res) => {
        res.json("Hello World!")
    })

    return app
}

module.exports = makeApp