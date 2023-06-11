const { RateLimiterMemory } = require("rate-limiter-flexible")

const rateLimiter = new RateLimiterMemory({
    keyPrefix: 'middleware',
    points: 6, // 6 requests
    duration: 1, // per 1 second by IP
  });
  
const rateLimiterMiddleware = (req, res, next) => {
    let points = 1
    if(req.originalUrl === "/api/shoppingCart") {
        points = 2
    }
    console.log(points)
    rateLimiter.consume(req.ip, points)
        .then(() => {
            next();
        })
        .catch(() => {
            res.status(429).send('Too Many Requests');
        });
};

module.exports = rateLimiterMiddleware