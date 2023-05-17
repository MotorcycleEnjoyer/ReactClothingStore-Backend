const express = require('express')
const app = express()
const uuidv4 = require('uuid').v4
const bcrypt = require('bcrypt')
const dotenv = require("dotenv")
dotenv.config()
const fs = require("fs")
const cors = require("cors")
const helper = require("./helper")
const mongoHelper = require("./mongoHelper")
const DATABASE_URL = process.env.NODE_ENV === "production" ? process.env.DB_PROD : process.env.DB_TEST
const path = require("path")
const email = require("./emailLogic/nodeMailerDemo")
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY)

const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true
}
app.use(cors(corsOptions));
app.use(express.urlencoded({extended: true}))
app.use(express.json())
app.use(express.static(path.join(__dirname, "build")))

let sessions, allUserData, allRatingsAndReviews, connectedToMongoDB, avgRatings

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
            // TESTING ONLY
            await setVars()
            // TESTING ONLY
            const temporaryUserId = uuidv4()
            helper.createAnonymousSession(temporaryUserId, sessions)
            helper.createAnonymousShoppingCart(temporaryUserId, allUserData)
            saveSessions(); saveUserData(); 
            let cart = await getShoppingCart(temporaryUserId)
            let payload
            if (sessions[temporaryUserId].csrfToken) {
                payload = {
                    csrfToken: sessions[temporaryUserId].csrfToken,
                    ...cart
                }
            } else {
                payload = { ...cart }
            }
            res.cookie('session', `${temporaryUserId}`, { httpOnly: true, secure: true, sameSite: "lax" })
            return res.send(payload)
        }
    } else {
        let csrfToken = sessions[sessionId].csrfToken
        const cart = await getShoppingCart(sessionId)
        res.status(200).send({csrfToken, ...cart})
    }
})

app.get('/backend/s', function(req,res){
    const query = helper.getQueryFromUrl(req.url)
    if(query === undefined || query.length > 50 || query.length === 0){
        return res.status(500).send("Invalid Query")
    }
        
    if(helper.hasOnlyNumbersAndLetters(query)){
        const searchResults = helper.getProductFromProductDatabase(query)
        return res.send(searchResults)
    }else{
        res.status(500).send("GET/s: INVALID SEARCH TERMS!!!")
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
        return res.status(401).send("Invalid cookie.")

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
        res.status(401).send("POST/editCartItem: Invalid cookie.")

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
        return res.status(401).send("POST/deleteCartItem: Invalid cookie.")
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
        return res.status(401).send("Invalid cookie.")
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
        return res.status(401).send("Invalid cookie.")
    }
    if(sessions[sessionId].type === "user"){
        return res.status(403).send("Already Logged In...")
    }

    const { username, password } = req.body
    console.log(username, password)

    if(username === undefined || password === undefined){
        return res.status(400).send("Login Error.")
    }

    if(username.length > 30 || password.length > 30){
        return res.status(400).send("Login Error")
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
        console.log(allUserData)
        userStore = helper.getUser(username, allUserData)
        usernameFound = ( userStore !== undefined && userStore !== null )
        if(usernameFound) {
            comparisonPassword = userStore.password
        }
    }

    if(!usernameFound) {
        return res.status(400).send("Login Error")
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
                    res.status(403).send("Already logged in!")
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
                    let csrfToken = uuidv4()
                    sessions[newSessionToken].csrfToken = csrfToken
                    saveSessions()
                    res.cookie('session', `${newSessionToken}`, { httpOnly: true, secure: true, sameSite: "lax" })
                    return res.status(200).send({csrfToken})
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
        return res.status(401).send("Invalid cookie.")
    }
    if(sessions[sessionId].type === "user"){
        return res.status(403).send("Already Logged In...")
    }

    const { username, password } = req.body

    if(username === undefined || password === undefined){
        return res.status(400).send("Error creating account.")
    }
    if(password.length < 8){
        return res.status(400).send("Password must be at least 8 characters.")
    }
    if(password.length > 30 || username.length > 30){
        return res.status(400).send("Error creating account.")
    }

    let nameIsAvailable = false
    if (connectedToMongoDB) {
        nameIsAvailable = await mongoHelper.getUser({username}) === null
    } else {
       nameIsAvailable = helper.userNameIsAvailable(username, allUserData) 
    }
    
    if (nameIsAvailable) {
        bcrypt.genSalt(12, async function(err, salt) {
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
                        sessionId
                    )
                    const newUser = await mongoHelper.getUser({username})
                    sessions[newSessionToken] = {type: "user", username: newUser.username}
                    deleteOldSession(sessionId)
                } else {
                    const permanentCartId = uuidv4()
                    allUserData.registeredUsers.push({username: username, password: hash, reviewsAndRatings: {}, cartId: permanentCartId, shoppingCart: [], orderHistory: []})
                    sessions[newSessionToken] = { type:"user", cartId: permanentCartId}
                    deleteTempUserCart(sessionId)
                    deleteOldSession(sessionId)
                    saveUserData();
                }
                let csrfToken = uuidv4()
                sessions[newSessionToken].csrfToken = csrfToken
                saveSessions()
                res.cookie('session', `${newSessionToken}`, { httpOnly: true, secure: true, sameSite: "lax" })
                return res.status(201).send({csrfToken})
            })
        });
    }else{
        return res.status(500).send("Username is taken.")
    }
})

app.post('/backend/logout', async (req,res) => {
    const sessionId = getSession(req.headers.cookie)
    if(sessionId === undefined)
        res.status(401).send("Invalid cookie.")

    if(sessions[sessionId].type === "user")
    {
        let temporaryUserId
        delete sessions[sessionId]
        if (connectedToMongoDB) {
            const newAnon = await mongoHelper.createAnon()
            sessions[newAnon.temporaryAnonCookie] = {type: "anonymous"}
            saveSessions()       
            res.set('Set-Cookie', `session=${newAnon.temporaryAnonCookie}`)
            const cart = { shoppingCart: newAnon.shoppingCart, type: "anonymous" }
            return res.status(200).send(cart)
        } else {
            temporaryUserId = uuidv4()
            helper.createAnonymousSession(temporaryUserId, sessions)
            helper.createAnonymousShoppingCart(temporaryUserId, allUserData)
            saveSessions(); saveUserData();        
        }
            res.cookie('session', `${temporaryUserId}`, { httpOnly: true, secure: true, sameSite: "lax" })
            return res.send("POST/logout: Logged out successfully!")

    }else{
        return res.status(401).send("POST/logout: You are not logged in!")
    }
})

app.post('/backend/ratings', async (req,res) => {
    const {rating, id} = req.body
    const sessionId = getSession(req.headers.cookie)
    if(sessionId === undefined)
        res.status(401).send("Invalid cookie.")

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
        return res.status(401).send("You are not logged in!")
    }
})

app.post('/backend/getRatingsAndReviews', async (req, res) => {
    const { id } = req.body
    if(id === undefined){
        return res.status(400).send("Invalid Query.")
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
    const { id, review, starRating } = req.body
    const sessionId = getSession(req.headers.cookie)
    if(sessionId === undefined)
        res.status(401).send("Invalid cookie.")

    if(!starRating || starRating > 5 || starRating < 0)
        return res.status(400).send("Invalid Review")

    if(review.length > 200){
        return res.status(400).send("Invalid Review")
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
            currProduct.ratings.push(starRating)
            saveAllRatingsAndReviews()
            const totalRatingsCount = currProduct.ratings.reduce((accumulator, currentItem) => accumulator + currentItem, 0)
            const averageRating = totalRatingsCount / currProduct.ratings.length
            console.log(`AVERAGE RATING: [${averageRating}]`)
            avgRatings[id] = { averageRating: averageRating.toFixed(2) }
            const reviews = Array.from(helper.limitedArrayPull(currProduct.reviews, i => i.length > 10, 10))
            res.send({reviews, averageRating})
        }
    }else{
        return res.status(401).send("You are not logged in!")
    }
})

app.post("/backend/submitCart", async (req, res) => {
    const response = await email.sendPresetMessage()
    console.log(response)
    res.send(response)
})

app.post("/backend/myDetails", async (req, res) => {
    const sessionId = getSession(req.headers.cookie)
    if(sessionId === undefined)
        return res.status(401).send("Invalid cookie.")

    const { csrfToken } = req.body
    console.log(`CSRF Token: [${csrfToken}]`)
    if (!csrfToken) {
        return res.status(401).send("Invalid authentication.")
    }
    // CSRF Token does not match user's.
    if (sessions[sessionId].csrfToken !== csrfToken){
        return res.status(401).send("Invalid authentication.")
    }
    

    if(connectedToMongoDB) {
        

    } else {
        if(sessions[sessionId].type === "user")
    {
        const user = helper.getUserByCartId(sessions[sessionId].cartId, allUserData)
        const data = {username: user.username, reviewsAndRatings: user.reviewsAndRatings, shoppingCart: user.shoppingCart}
        return res.send(data)
    } else {
        return res.status(401).send("You must login to access this page.")
    }
    }
})

app.get("/backend/productImages/:imageName", async (req, res) => {
    const { imageName } = req.params
    const imagePath = path.resolve(__dirname, "ProductImages", imageName)
    res.sendFile(imagePath)
})

app.post("/backend/stripeCheckout", async (req, res) => {
    const sessionId = getSession(req.headers.cookie)
    const sessionObj = sessions[sessionId]
    if(sessionId === undefined || sessionObj === undefined)
        return res.status(401).send("Invalid cookie.")

    if(!req.body || req.body === {})
        return res.status(400).send("Invalid order.")

    try {
        const stripeSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: req.body.map(item => {
                const product = helper.getProductFromProductDatabase(null, item.details.id)
                return {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: product.details.name,

                        },
                        unit_amount: (product.details.price * 100)
                    },
                    quantity: item.amount
                }
            }),
            success_url: `${process.env.SERVER_URL}/userPage`,
            cancel_url: `${process.env.SERVER_URL}/`
        })
        res.json({ url: stripeSession.url })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: error.message})
    }
})

function returnBasicOrder(shoppingCart) {
    return shoppingCart.map((item, index) => {
        return {
            id: item.details.id,
            userSelectedParameters: item.userSelectedParameters,
            amount: item.amount,
            pricePerItem: item.details.price
        }
    })
}

app.post("/backend/submitOrder", async (req, res) => {
    const sessionId = getSession(req.headers.cookie)
    const sessionObj = sessions[sessionId]
    if(sessionId === undefined || sessionObj === undefined)
        return res.status(401).send("Invalid cookie.")

    if(!req.body || req.body === {})
        return res.status(400).send("Invalid order.")

    const data = returnBasicOrder(req.body)
    const user = helper.getUserByCartId(sessionObj.cartId, allUserData)
    user.orderHistory.push(data)
    user.shoppingCart.length = 0
    saveUserData()
    
    res.send(await getShoppingCart(sessionId))
})

app.get("/*", (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'))
})

app.get("*", (req, res) =>{
    res.status(404)
    res.send(`<h1>Error 404, page not found</h1>`)
})

module.exports = app
