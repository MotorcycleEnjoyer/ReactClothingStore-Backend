const express = require('express')
const app = express()
const uuidv4 = require('uuid').v4
const bcrypt = require('bcrypt')
const saltRounds = 12
const fs = require("fs")
const cors = require("cors")
const helper = require("./helper")
const mongoHelper = require("./mongoHelper")
const DATABASE_URL = "INVALID_MONGO_URL__mongodb://127.0.0.1:27017/react_clothing_store_db"
const path = require("path")

const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true
}
app.use(cors(corsOptions));
app.use(express.urlencoded({extended: true}))
app.use(express.json())
app.use(express.static(path.join(__dirname, "build")))

let sessions, allUserData, allRatingsAndReviews, connectedToMongoDB, avgRatings

module.exports = app

async function setVars(){
    connectedToMongoDB = await mongoHelper.connectToDatabase(DATABASE_URL)
    console.log(`Mongo connection succeeded? [${connectedToMongoDB}]`)
    if (connectedToMongoDB) {
        sessions = {}
        avgRatings = await loadRatings()
    } else {
        console.log("Mongo Failed, Reverting to JSON File Storage.")
        sessions = await loadSessions()
        avgRatings = await loadRatings()
        allUserData = await loadUsers()
        allRatingsAndReviews = await loadAllRatingsAndReviews()
    }
}
setVars()

const loadFile = async (fileName) => {
    try{
        const data = await fs.promises.readFile(fileName, "utf-8")
        const temp = JSON.parse(data) || undefined
        return temp
    } catch (error){
        console.error(error)
        return undefined
    }
}

async function loadAllRatingsAndReviews(){
    const ratings = await loadFile('allRatingsAndReviews.json') || {
        "0": {
            "reviews": [],
            "ratings": []
        },
        "1": {
            "reviews": [],
            "ratings": []
        },
        "2": {
            "reviews": [],
            "ratings": []
        },
    }
    return ratings
}

async function loadRatings(){
    const ratings = await loadFile('ratings.json') || {}
    return ratings
}

async function loadSessions(){
    const sessions = await loadFile('sessions.json') || {}
    return sessions
}

async function loadUsers(){
    const users = await loadFile('shoppingCarts.json') || {"registeredUsers": [], "anonymousCarts": {}}
    return users
}

function saveSessions(){
    saveDataAsJSON('sessions.json', sessions)
}

function saveRatings(){
    saveDataAsJSON('ratings.json', avgRatings)
}

function saveUserData(){
    saveDataAsJSON('shoppingCarts.json', allUserData)
}
function saveAllRatingsAndReviews(){
    saveDataAsJSON('allRatingsAndReviews.json', allRatingsAndReviews)
}

async function saveDataAsJSON(fileName, sourceVariable){
    fs.writeFile(fileName, JSON.stringify(sourceVariable), (err)=>{
        if (err) {
          console.error(err);
        }
    })
}

function deleteTempUserCart(cookie){
    delete allUserData.anonymousCarts[cookie]
    saveUserData()
}

function getSession(cookie){
    if(cookie === undefined)
    {
        console.log("COOKIE NOT FOUND")
        return undefined
    }
    const sessionId = cookie.split('=')[1]
    const userSession = sessions[sessionId]
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
    if (connectedToMongoDB) {
        if(sessionObj.type === "anonymous"){
            const { shoppingCart } = await mongoHelper.getUser({ temporaryAnonCookie: sessionId })
            return { shoppingCart, type: "anonymous"}
        }else{
            const myUser = await mongoHelper.getUser({ username: sessionObj.username })
            return { shoppingCart: myUser.shoppingCart, type: "user" }
        }
    } else {
        if(sessionObj.type === "anonymous"){
            const user = allUserData.anonymousCarts[sessionId]
            return { shoppingCart: user.shoppingCart, type: "anonymous" }
        }else{
            const user = helper.getUserByCartId(sessionObj.cartId, allUserData)
            console.log(user)
            return { shoppingCart: user.shoppingCart, type: "user"}
        }
    }
}

app.get("/test", (req, res) => {
    res.json({hello: "world"})
})

app.get("/backend/shoppingCart", async (req, res) => {
    const sessionId = getSession(req.headers.cookie)
    if(sessionId === undefined || !sessionId){
        if (connectedToMongoDB) {
            const newAnon = await mongoHelper.createAnon()
            sessions[newAnon.temporaryAnonCookie] = {type: "anonymous"}
            saveSessions()       
            res.set('Set-Cookie', `session=${newAnon.temporaryAnonCookie}`)
            const cart = { shoppingCart: newAnon.shoppingCart, type: "anonymous" }
            return res.status(200).send(cart)
        } else {
            const temporaryUserId = uuidv4()
            helper.createAnonymousSession(temporaryUserId, sessions)
            helper.createAnonymousShoppingCart(temporaryUserId, allUserData)
            saveSessions(); saveUserData();        
            res.set('Set-Cookie', `session=${temporaryUserId}`)
            return res.send(await getShoppingCart(temporaryUserId))
        }
        
    } else {
        await getShoppingCart(sessionId)
        res.status(200).send(await getShoppingCart(sessionId))
    }
})

app.get('/backend/s', function(req,res){
    const query = helper.getQueryFromUrl(req.url)
    if(query === undefined || query.length > 50){
        return res.status(500).send("Invalid Query")
    }
        
    if(helper.hasOnlyNumbersAndLetters(query)){
        const searchResults = helper.getProductFromProductDatabase(query)
        return res.send(searchResults)
    }else{
        res.send("GET/s: INVALID SEARCH TERMS!!!")
    }
    
})

app.get('/backend/p/*/id/*', function(req,res){

    const productId = helper.getProductIdFromUrl(req.url)
    const searchResults = helper.getProductFromProductDatabase("NoName", productId)

    return res.send(searchResults)
})

app.post('/backend/suggestions', function(req,res){
    const phrase = req.body.searchTerm
    if(phrase === undefined || phrase.length > 50 || phrase.length === 0)
    {
        return res.status(500).send("Invalid Query")
    }
    if(helper.hasOnlyNumbersAndLetters(phrase)){
        const searchSuggestions = helper.findSearchSuggestions(phrase)
        return res.send(searchSuggestions)
    }else{
        res.status(500).send("POST/suggestions: Invalid Characters")
    }
})

app.post('/backend/addToCart', async function(req,res){
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
        if (connectedToMongoDB) {
            if (sessions[sessionId].type === "anonymous") {
                const shoppingCart = await mongoHelper.addItemToMongoCart(dataObject, { temporaryAnonCookie: sessionId })
                return res.status(200).send({shoppingCart, type: "anonymous"})    
            } else {
                const shoppingCart = await mongoHelper.addItemToMongoCart(dataObject, { username: sessions[sessionId].username})
                return res.status(200).send({ shoppingCart, type: "user" })
            }
        } else {
            const cart = await getShoppingCart(sessionId)
            const incrementedExisting = helper.incrementAmountOfExistingCartItem(cart.shoppingCart, productId, newUserChoices, parseInt(amount))
            if (incrementedExisting) {
                saveUserData()
                return res.status(200).send(await getShoppingCart(sessionId))    
            } else {
                const tempObject = helper.createNewObject(productId, newUserChoices, parseInt(amount))
                const myCart = await getShoppingCart(sessionId)
                myCart.shoppingCart.push(tempObject)
                saveUserData();
                return res.status(200).send(await getShoppingCart(sessionId))
            }
        }
    } else {
        return res.status(200).send("Invalid data provided.")
    }
    
})

app.post('/backend/editCartItem', async (req, res) => {
    const sessionId = getSession(req.headers.cookie)
    if(sessionId === undefined)
        res.send("POST/editCartItem: Invalid cookie.")

    const {productId, oldUserChoices, newUserChoices, index, amount } = req.body
    if( 
        helper.validateDataGiven(productId, newUserChoices, amount) &&
        helper.validateDataGiven(productId, oldUserChoices, amount)
    ){   
        if (connectedToMongoDB) {
            if(sessions[sessionId].type === "anonymous"){
                const shoppingCart = await mongoHelper.editItemInMongoCart({productId, oldUserChoices, newUserChoices, index, amount: parseInt(amount)}, { temporaryAnonCookie: sessionId })
                return res.status(200).send({shoppingCart, type: "anonymous"})
            } else{
                const shoppingCart = await mongoHelper.editItemInMongoCart({productId, oldUserChoices, newUserChoices, index, amount: parseInt(amount)}, { username: sessions[sessionId].username })
                return res.status(200).send({shoppingCart, type: "user"})
            }
        } else{
            const cart = await getShoppingCart(sessionId)
            if(helper.areIdentical(oldUserChoices, newUserChoices)) {
                // change the value of current object
                cart.shoppingCart[index].amount = parseInt(amount)
            } else {
                const indexOfIdenticalMatch = cart.shoppingCart.findIndex((item) => {
                    if(helper.areIdentical(item.userSelectedParameters, newUserChoices)){
                        return item
                    }
                })
    
                const itemExistsInAnotherIndex = indexOfIdenticalMatch !== -1
                if( itemExistsInAnotherIndex ) {
                    // increment that other object
                    cart.shoppingCart[indexOfIdenticalMatch].amount += parseInt(amount)
                    helper.deleteItemFromCart(cart.shoppingCart, index)
                } else {
                    // create a new object
                    helper.deleteItemFromCart(cart.shoppingCart, index)
                    cart.shoppingCart.push(helper.createNewObject(productId, newUserChoices, parseInt(amount)))
                }
            }
            saveUserData()
            return res.status(200).send(await getShoppingCart(sessionId))
        }       
    }else{
        return res.status(200).send("Invalid Data!")
    }
})

app.post('/backend/deleteCartItem', async (req, res) => {
    const sessionId = getSession(req.headers.cookie)
    if(sessionId === undefined){
        return res.send("POST/deleteCartItem: Invalid cookie.")
    }
    
    const {indexOfCartItem} = req.body

    if(indexOfCartItem < 0){
        return res.status(200).send("POST/deleteCartItem: Invalid Data.")
    }

    if (connectedToMongoDB) {
        if(sessions[sessionId].type === "anonymous"){
            const shoppingCart = await mongoHelper.deleteItemInMongoCart(indexOfCartItem, { temporaryAnonCookie: sessionId })
            return res.status(200).send({shoppingCart, type: "anonymous"})
        } else{
            const shoppingCart = await mongoHelper.deleteItemInMongoCart(indexOfCartItem, { username: sessions[sessionId].username})
            return res.status(200).send({ shoppingCart, type: "user" })
        }
    } else {
        const cart = await getShoppingCart(sessionId)
        helper.deleteItemFromCart(cart.shoppingCart, indexOfCartItem)
        saveUserData()
        return res.status(200).send(await getShoppingCart(sessionId))
    }
})

app.post('/backend/clearCart', async (req, res) => {
    const sessionId = getSession(req.headers.cookie)
    if(sessionId === undefined){
        return res.send("Invalid cookie.")
    }
    if (connectedToMongoDB) { 
        if(sessions[sessionId].type === "anonymous"){
            const shoppingCart = await mongoHelper.clearCartInMongo({ temporaryAnonCookie: sessionId })
            return res.status(200).send({shoppingCart, type: "anonymous"})
        } else{
            const shoppingCart = await mongoHelper.clearCartInMongo({ username: sessions[sessionId].username })
            return res.status(200).send({ shoppingCart, type: "user" })
        }
    } else {
        const cart = await getShoppingCart(sessionId)
        cart.shoppingCart.length = 0
        saveUserData()
        return res.status(200).send(await getShoppingCart(sessionId))
    }
    
})

app.post('/backend/login', async (req, res) => {
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

    let usernameFound = false 
    let comparisonPassword = ""
    let userStore, mongoStore
    if (connectedToMongoDB) {
        mongoStore = await mongoHelper.getUser({username})
        usernameFound = ( mongoStore !== null )
        if(usernameFound){
            comparisonPassword = mongoStore.password
        }
    } else {
        userStore = helper.getUser(username, allUserData)
        usernameFound = ( userStore !== undefined && userStore !== null )
        if(usernameFound) {
            comparisonPassword = userStore.password
        }
    }

    if(!usernameFound) {
        return res.status(500).send("Login Error")
    } else {
        bcrypt.compare(password, comparisonPassword, async (err, result) => {
            if(err){
                console.log(err)
                return
            }
            if(result){    
                const arr = Object.keys(sessions)
                const isAlreadyLoggedIn = arr.findIndex((item) => {
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
                    if (connectedToMongoDB) {
                        sessions[newSessionToken] = {type: "user", username: username}
                        deleteOldSession(sessionId)
                        saveSessions()
                        await mongoHelper.deleteAnon({temporaryAnonCookie: sessionId})
                    } else {
                        deleteOldSession(sessionId)
                        deleteTempUserCart(sessionId)
                        const cartId = userStore.cartId
                        sessions[newSessionToken] = { type:"user", cartId: cartId}
                        saveSessions(); saveUserData();
                    }
                    res.set('Set-Cookie', `session=${newSessionToken}`)
                    res.status(200).send("POST/login: Logged in successfuly!")
                }
            }else{
                console.log("POST/login: bad creds BECAUSE BCRYPT FAILED")
                return res.status(401).send("Incorrect credentials. Please try again")
            }
        })
    }
})

app.post("/backend/register", async (req,res) => {
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

    let nameIsAvailable = false
    if (connectedToMongoDB) {
        nameIsAvailable = await mongoHelper.getUser({username}) === null
    } else {
       nameIsAvailable = helper.userNameIsAvailable(username, allUserData) 
    }
    
    if (nameIsAvailable) {
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
                if (connectedToMongoDB) {
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
                } else {
                    const permanentCartId = uuidv4()
                    allUserData.registeredUsers.push({username: username, password: hash, reviewsAndRatings: {}, cartId: permanentCartId, shoppingCart: []})
                    sessions[newSessionToken] = { type:"user", cartId: permanentCartId}
                    deleteTempUserCart(sessionId)
                    deleteOldSession(sessionId)
                    saveSessions(); saveUserData();
                }

                res.set('Set-Cookie', `session=${newSessionToken}`)
                return res.status(200).send("POST/register: Registered Successfully!")
            })
        });
    }else{
        return res.status(500).send("Username is taken.")
    }
})

app.post('/backend/logout', async (req,res) => {
    const sessionId = getSession(req.headers.cookie)
    if(sessionId === undefined)
        res.send("Invalid cookie.")

    if(sessions[sessionId].type === "user")
    {
        delete sessions[sessionId]
        if (connectedToMongoDB) {
            const newAnon = await mongoHelper.createAnon()
            sessions[newAnon.temporaryAnonCookie] = {type: "anonymous"}
            saveSessions()       
            res.set('Set-Cookie', `session=${newAnon.temporaryAnonCookie}`)
            const cart = { shoppingCart: newAnon.shoppingCart, type: "anonymous" }
            return res.status(200).send(cart)
        } else {
            const temporaryUserId = uuidv4()
            helper.createAnonymousSession(temporaryUserId, sessions)
            helper.createAnonymousShoppingCart(temporaryUserId, allUserData)
            saveSessions(); saveUserData();        
            res.set('Set-Cookie', `session=${temporaryUserId}`)
            return res.send("POST/logout: Logged out successfully!")
        }
    }else{
        res.status(200)
        return res.send("POST/logout: You are not logged in!")
    }
})

app.post('/backend/ratings', async (req,res) => {
    const {rating, id} = req.body
    const sessionId = getSession(req.headers.cookie)
    if(sessionId === undefined)
        res.send("Invalid cookie.")

    if(sessions[sessionId].type === "user")
    {
        if (connectedToMongoDB) {
            const dataObj = { productId: parseInt(id), rating: rating }
            const username = sessions[sessionId].username
            await mongoHelper.addItemToUserReview(dataObj, username)

            const currProduct = await mongoHelper.getAllReviewsForProduct({productId: id})
            const totalRatingsCount = currProduct.ratingArray.reduce((accumulator, currentItem) => accumulator + currentItem, 0)
            const averageRating = totalRatingsCount / currProduct.ratingArray.length

            avgRatings[id] = { averageRating: averageRating.toFixed(2) }
            saveRatings()
            return res.send({averageRating})
        } else {
            const currProduct = allRatingsAndReviews[id]
            currProduct.ratings.push(rating)
            saveAllRatingsAndReviews()
            const totalRatingsCount = currProduct.ratings.reduce((accumulator, currentItem) => accumulator + currentItem, 0)
            const averageRating = totalRatingsCount / currProduct.ratings.length
            avgRatings[id] = { averageRating: averageRating.toFixed(2) }
            return res.send({averageRating})
        }
        
    }else{
        res.status(500)
        return res.send("You are not logged in!")
    }
})

app.post('/backend/getRatingsAndReviews', async (req, res) => {
    const { id } = req.body
    if(id === undefined){
        return res.status(500).send("Invalid Query.")
    }
    if (connectedToMongoDB) {
        const currProduct = await mongoHelper.getAllReviewsForProduct({ productId: parseInt(id) })
        if ( currProduct === null ){
            return res.status(200).send({ averageRating: null, reviews: null })
        } else {
            const totalRatingsCount = currProduct.ratingArray.reduce((accumulator, currentItem) => accumulator + currentItem, 0)
            const averageRating = totalRatingsCount / currProduct.ratingArray.length 
            const reviews = currProduct.reviewArray //Array.from(helper.limitedArrayPull(currProduct.reviews, i => i.length > 10, 10))
    
            return res.status(200).send({averageRating: averageRating, reviews})
        }
    } else {
        const currProduct = allRatingsAndReviews[id]
        const totalRatingsCount = currProduct.ratings.reduce((accumulator, currentItem) => accumulator + currentItem, 0)
        const averageRating = totalRatingsCount / currProduct.ratings.length
        const reviews = Array.from(helper.limitedArrayPull(currProduct.reviews, i => i.length > 10, 10))
        return res.status(200).send({averageRating, reviews})
    }    
})

app.post('/backend/reviews', async (req, res) => {
    const { id, review } = req.body
    const sessionId = getSession(req.headers.cookie)
    if(sessionId === undefined)
        res.send("Invalid cookie.")

    if(review === undefined || review === null || review.length > 200){
        return res.status(500).send("Invalid Review")
    }
    if(sessions[sessionId].type === "user")
    {
        if (connectedToMongoDB) {
            const username = sessions[sessionId].username
            const reviewObj = {
                productId: id, 
                review: review
            }
            await mongoHelper.addItemToUserReview(reviewObj, username)
            const allReviews = await mongoHelper.getAllReviewsForProduct({productId: id})
            const reviews = allReviews.reviewArray //Array.from(helper.limitedArrayPull(allReviews.reviews, i => i.length > 10, 10))
            return res.send({reviews})
        } else {
            const currProduct = allRatingsAndReviews[id]
            currProduct.reviews.push(review)
            saveAllRatingsAndReviews()
            const reviews = Array.from(helper.limitedArrayPull(currProduct.reviews, i => i.length > 10, 10))
            res.send({reviews})
        }
    }else{
        res.status(500)
        return res.send("You are not logged in!")
    }
})

app.get("/*", (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'))
})

app.get("*", (req, res) =>{
    res.status(404)
    res.send(`<h1>Error 404, page not found</h1>`)
})