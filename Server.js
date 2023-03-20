const express = require('express')
const app = express()
const uuidv4 = require('uuid').v4
const bcrypt = require('bcrypt')
const saltRounds = 12
const fs = require("fs")
const cors = require("cors")
const helper = require("./helper")
const { RateLimiterMemory } = require('rate-limiter-flexible');
const mongoHelper = require("./mongoHelper")
const DATABASE_URL = "mongodb://127.0.0.1:27017/react_clothing_store_db"

const opts = {
    points: 4, // 6 points
    duration: 3, // Per second
  };
  
const rateLimiter = new RateLimiterMemory(opts);

const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true
}
app.use(cors(corsOptions));
app.use(express.urlencoded({extended: true}))
app.use(express.json())

let sessions, userCredentials, allShoppingCarts, allRatingsAndReviews, connectedToMongoDB, avgRatings

app.listen(5000, console.log("Running on port 5000"), async () => {
    connectedToMongoDB = await mongoHelper.connectToDatabase(DATABASE_URL)
    sessions = await loadSessions()
    avgRatings = await loadRatings()
})

const loadFile = async (fileName) => {
    try{
        const data = await fs.promises.readFile(fileName, "utf-8")
        let temp = JSON.parse(data) || undefined
        return temp
    } catch (error){
        console.error(error)
        return undefined
    }
}

async function loadRatings(){
    let ratings = await loadFile('ratings.json') || {}
    return ratings
}

async function loadSessions(){
    let sessions = await loadFile('sessions.json') || {}
    return sessions
}

function saveSessions(){
    saveDataAsJSON('sessions.json', sessions)
}

function saveRatings(){
    saveDataAsJSON('ratings.json', avgRatings)
}

async function saveDataAsJSON(fileName, sourceVariable){
    fs.writeFile(fileName, JSON.stringify(sourceVariable), (err)=>{
        if (err) {
          console.error(err);
        }
    })
}

function getSession(cookie){
    if(cookie === undefined)
        return undefined
    let sessionId = cookie.split('=')[1]
    let userSession = sessions[sessionId]
    if(!userSession){
        console.log("USER SESSION NOT FOUND")
        return undefined
    }
    return sessionId
}

function deleteOldSession(cookie){
    delete sessions[cookie]
    saveSessions()
}

async function getShoppingCart(sessionId){
    const sessionObj = sessions[sessionId]
    if(sessionObj.type === "anonymous"){
        const { shoppingCart } = await mongoHelper.getUser({ temporaryAnonCookie: sessionId })
        return { shoppingCart, type: "anonymous"}
    }else{
        const myUser = await mongoHelper.getUser({ username: sessionObj.username })
        return { shoppingCart: myUser.shoppingCart, type: "user" }
    }
}

app.get("/shoppingCart", async (req, res) => {
    const sessionId = getSession(req.headers.cookie)
    if(sessionId === undefined || !sessionId){
        const newAnon = await mongoHelper.createAnon()
        sessions[newAnon.temporaryAnonCookie] = {type: "anonymous"}
        saveSessions()       
        res.set('Set-Cookie', `session=${newAnon.temporaryAnonCookie}`)
        const cart = { shoppingCart: newAnon.shoppingCart, type: "anonymous" }
        return res.status(200).send(cart)
    }
    const cart = await getShoppingCart(sessionId)
    res.status(200).send(cart)
})

app.get('/s', function(req,res){
    let query = helper.getQueryFromUrl(req.url)
    if(query === undefined || query.length > 50){
        return res.status(500).send("Invalid Query")
    }
        
    if(helper.hasOnlyNumbersAndLetters(query)){
        let searchResults = helper.getProductFromProductDatabase(query)
        return res.send(searchResults)
    }else{
        res.send("GET/s: INVALID SEARCH TERMS!!!")
    }
    
})

app.get('/p/*/id/*', function(req,res){

    let productId = helper.getProductIdFromUrl(req.url)
    let searchResults = helper.getProductFromProductDatabase("NoName", productId)

    return res.send(searchResults)

    rateLimiter.consume(req.headers.cookie, 2) // consume 2 points
      .then((rateLimiterRes) => {
        // 2 points consumed
        
      })
      .catch((rateLimiterRes) => {
        // Not enough points to consume
        return res.send("TOO MANY REQUESTS! SLOW DOWN!")
      });
    
})

app.post('/suggestions', function(req,res){
    let phrase = req.body.searchTerm
    if(phrase === undefined || phrase.length > 50)
    {
        return res.status(500).send("Invalid Query")
    }
    if(helper.hasOnlyNumbersAndLetters(phrase)){
        let searchSuggestions = helper.findSearchSuggestions(phrase)
        return res.send(searchSuggestions)
    }else{
        res.send("POST/suggestions: Invalid Characters")
    }
})

app.post('/addToCart', async function(req,res){
    const sessionId = getSession(req.headers.cookie)
    if(sessionId === undefined)
        res.send("Invalid cookie.")

    const {productId, newUserChoices, amount } = req.body
    
    if(helper.validateDataGiven(productId, newUserChoices, amount)){
        const dataObject = {
            ...helper.getProductFromProductDatabase(null, productId), 
            userSelectedParameters: newUserChoices, 
            amount: parseInt(amount)
        }
        if(sessions[sessionId].type === "anonymous"){
            const shoppingCart = await mongoHelper.addItemToMongoCart(dataObject, { temporaryAnonCookie: sessionId })
            return res.status(200).send({shoppingCart, type: "anonymous"})
        } else{
            const shoppingCart = await mongoHelper.addItemToMongoCart(dataObject, { username: sessions[sessionId].username})
            return res.status(200).send({ shoppingCart, type: "user" })
        }
    } else {
        return res.status(200).send("Invalid data provided.")
    }
    
})

app.post('/editCartItem', async (req, res) => {
    const sessionId = getSession(req.headers.cookie)
    if(sessionId === undefined)
        res.send("POST/editCartItem: Invalid cookie.")

    const {productId, oldUserChoices, newUserChoices, index, amount } = req.body
    if( 
        helper.validateDataGiven(productId, newUserChoices, amount) &&
        helper.validateDataGiven(productId, oldUserChoices, amount)
    ){   
        if(sessions[sessionId].type === "anonymous"){
            const shoppingCart = await mongoHelper.editItemInMongoCart({productId, oldUserChoices, newUserChoices, index, amount: parseInt(amount)}, { temporaryAnonCookie: sessionId })
            return res.status(200).send({shoppingCart, type: "anonymous"})
        } else{
            const shoppingCart = await mongoHelper.editItemInMongoCart({productId, oldUserChoices, newUserChoices, index, amount: parseInt(amount)}, { username: sessions[sessionId].username })
            return res.status(200).send({shoppingCart, type: "user"})
        }
    }else{
        return res.status(200).send("Invalid Data!")
    }
})

app.post('/deleteCartItem', async (req, res) => {
    const sessionId = getSession(req.headers.cookie)
    if(sessionId === undefined){
        return res.send("POST/deleteCartItem: Invalid cookie.")
    }
    
    const {indexOfCartItem} = req.body

    if(indexOfCartItem < 0){
        return res.status(200).send("POST/deleteCartItem: Invalid Data.")
    }

    if(sessions[sessionId].type === "anonymous"){
        const shoppingCart = await mongoHelper.deleteItemInMongoCart(indexOfCartItem, { temporaryAnonCookie: sessionId })
        return res.status(200).send({shoppingCart, type: "anonymous"})
    } else{
        const shoppingCart = await mongoHelper.deleteItemInMongoCart(indexOfCartItem, { username: sessions[sessionId].username})
        return res.status(200).send({ shoppingCart, type: "user" })
    }
})

app.post('/clearCart', async (req, res) => {
    const sessionId = getSession(req.headers.cookie)
    if(sessionId === undefined){
        return res.send("Invalid cookie.")
    }
    if(sessions[sessionId].type === "anonymous"){
        const shoppingCart = await mongoHelper.clearCartInMongo({ temporaryAnonCookie: sessionId })
        return res.status(200).send({shoppingCart, type: "anonymous"})
    } else{
        const shoppingCart = await mongoHelper.clearCartInMongo({ username: sessions[sessionId].username })
        return res.status(200).send({ shoppingCart, type: "user" })
    }
})

app.post('/login', async (req, res) => {
    const sessionId = getSession(req.headers.cookie)
    if(sessionId === undefined){
        return res.send("Invalid cookie.")
    }
    if(sessions[sessionId].type === "user"){
        return res.send("Already Logged In...")
    }

    const { username, password } = req.body

    if(username === undefined || password === undefined){
        return res.status(500).send("Login Error.")
    }

    if(username.length > 30 || password.length > 30){
        return res.status(500).send("Login Error")
    }
    const mongoSearchForUsername = await mongoHelper.getUser({username})
    console.log(mongoSearchForUsername)
    if(mongoSearchForUsername === null) {
        return res.status(500).send("Login Error")
    } else {
        bcrypt.compare(password, mongoSearchForUsername.password, async (err, result) => {
            if(err){
                console.log(err)
                return
            }
            if(result){    
                let arr = Object.keys(sessions)
                let isAlreadyLoggedIn = arr.findIndex((item) => {
                    if (item.username !== undefined) {
                        if (item.username === username ) {
                            return item
                        }
                    }
                }) !== -1

                if(isAlreadyLoggedIn){
                    res.status(401).send("POST/login: Already logged in!")
                }
                if(!isAlreadyLoggedIn){

                    const newSessionToken = uuidv4()
                    sessions[newSessionToken] = {type: "user", username: username}
                    deleteOldSession(sessionId)
                    saveSessions()
                    await mongoHelper.deleteAnon({temporaryAnonCookie: sessionId})
                    res.set('Set-Cookie', `session=${newSessionToken}`)
                    return res.status(200).send("POST/login: Logged in successfuly!")
                }
            }else{
                console.log("POST/login: bad creds BECAUSE BCRYPT FAILED")
                return res.status(401).send("Incorrect credentials. Please try again")
            }
        })
    }
})

app.post("/register", async (req,res) => {
    const sessionId = getSession(req.headers.cookie)
    if(sessionId === undefined){
        return res.send("Invalid cookie.")
    }
    if(sessions[sessionId].type === "user"){
        return res.send("Already Logged In...")
    }

    const { username, password } = req.body

    if(username === undefined || password === undefined){
        return res.status(500).send("Error creating account.")
    }
    if(password.length < 8){
        return res.status(500).send("Password must be at least 8 characters.")
    }
    if(password.length > 30 || username.length > 30){
        return res.status(500).send("Error creating account.")
    }
    const mongoSearchForUsername = await mongoHelper.getUser({username})
    if(mongoSearchForUsername === null){
        bcrypt.genSalt(saltRounds, async function(err, salt) {
            if(err){
                console.log(err)
                return res.status(500).send("Error creating account.")
            }
            bcrypt.hash(password, salt, async function(err, hash) {
                if(err){
                    return res.status(500).send("Error creating account.")
                }
                const newSessionToken = uuidv4()
                
                await mongoHelper.createUserAndDeleteAnon(
                    {
                        username: username, 
                        password: hash
                    }, 
                    { 
                        temporaryAnonCookie: sessionId
                    }
                )
                const newUser = await mongoHelper.getUser({username})
                sessions[newSessionToken] = {type: "user", username: newUser.username}
                deleteOldSession(sessionId)
                saveSessions()
                res.set('Set-Cookie', `session=${newSessionToken}`)
                res.status(200).send("POST/register: Registered Successfully!")
            })
        });
    }else{
        return res.status(500).send("Username is taken.")
    }
})

app.post('/logout', (req,res) => {
    const sessionId = getSession(req.headers.cookie)
    if(sessionId === undefined)
        res.send("Invalid cookie.")

    if(sessions[sessionId].type === "user")
    {
        delete sessions[sessionId]
    }else{
        res.status(200)
        return res.send("POST/logout: You are not logged in!")
    }
    
    saveSessions()
    res.set('Set-Cookie', 'session=; expires=Thu, 01 Jan 1970 00:00:00 GMT') 
    res.send("POST/logout: Logged out successfully!")
})

app.get("*", (req, res) =>{
    res.status(404)
    res.send(`<h1>Error 404, page not found</h1>`)
})

app.post('/ratings', async (req,res) => {
    const {rating, id} = req.body
    const sessionId = getSession(req.headers.cookie)
    if(sessionId === undefined)
        res.send("Invalid cookie.")

    if(sessions[sessionId].type === "user")
    {
        const dataObj = { productId: parseInt(id), rating: rating }
        const username = sessions[sessionId].username
        await mongoHelper.addItemToUserReview(dataObj, username)

        const currProduct = await mongoHelper.getAllReviewsForProduct({productId: id})
        const totalRatingsCount = currProduct.ratingArray.reduce((accumulator, currentItem) => accumulator + currentItem, 0)
        const averageRating = totalRatingsCount / currProduct.ratingArray.length

        avgRatings[id] = { averageRating: averageRating.toFixed(2) }
        saveRatings()
        return res.send({averageRating})
    }else{
        res.status(500)
        return res.send("You are not logged in!")
    }
})

app.post('/getRatingsAndReviews', async (req, res) => {
    const { id } = req.body
    if(id === undefined){
        return res.status(500).send("Invalid Query.")
    }
    const currProduct = await mongoHelper.getAllReviewsForProduct({ productId: parseInt(id) })
    
    if ( currProduct === null ){
        return res.status(200).send({ averageRating: null, reviews: null })
    } else {
        const totalRatingsCount = currProduct.ratingArray.reduce((accumulator, currentItem) => accumulator + currentItem, 0)
        const averageRating = totalRatingsCount / currProduct.ratingArray.length 
        const reviews = currProduct.reviewArray //Array.from(helper.limitedArrayPull(currProduct.reviews, i => i.length > 10, 10))

        return res.status(200).send({averageRating: averageRating, reviews})
        
    }
})

app.post('/reviews', async (req, res) => {
    const { id, review } = req.body
    const sessionId = getSession(req.headers.cookie)
    if(sessionId === undefined)
        res.send("Invalid cookie.")

    if(review === undefined || review === null || review.length > 200){
        return res.status(500).send("Invalid Review")
    }
    if(sessions[sessionId].type === "user")
    {
        const username = sessions[sessionId].username
        const reviewObj = {
            productId: id, 
            review: review
        }
        await mongoHelper.addItemToUserReview(reviewObj, username)
        const allReviews = await mongoHelper.getAllReviewsForProduct({productId: id})
        const reviews = allReviews.reviewArray //Array.from(helper.limitedArrayPull(allReviews.reviews, i => i.length > 10, 10))
        return res.send({reviews})
    }else{
        res.status(500)
        return res.send("You are not logged in!")
    }
})
