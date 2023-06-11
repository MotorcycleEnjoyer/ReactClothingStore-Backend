const express = require("express")
const uuidv4 = require('uuid').v4
const { RateLimiterMemory } = require("rate-limiter-flexible")

function makeApp (database) {
    const opts = {
        points: 11,
        duration: 60
    }
    const rateLimiter = new RateLimiterMemory(opts)
    const app = express()
    app.use(express.json())

    const sessions = {}

    app.get("/", (req, res) => {
        const ipAddress = req.socket.remoteAddress;
        rateLimiter.consume(ipAddress, 1)
        .then((rateLimiterRes) => {
            // Allowed
            const headers = {
                "Retry-After": rateLimiterRes.msBeforeNext / 1000,
                "X-RateLimit-Limit": opts.points,
                "X-RateLimit-Remaining": rateLimiterRes.remainingPoints,
                "X-RateLimit-Reset": new Date(Date.now() + rateLimiterRes.msBeforeNext)
            }
            res.header(headers)
            return res.json("Hello World!")
          })
          .catch((rej) => {
            // Blocked
            return res.status(429).json("Too many requests!!!")
          });   
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