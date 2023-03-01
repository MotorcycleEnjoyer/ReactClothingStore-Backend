const express = require('express')
const app = express()
const uuidv4 = require('uuid').v4
const bcrypt = require('bcrypt')
const saltRounds = 12
const fs = require("fs")
const cors = require("cors")
const helper = require("./helper")
const { RateLimiterMemory } = require('rate-limiter-flexible');


const opts = {
    points: 4, // 6 points
    duration: 3, // Per second
  };
  
const rateLimiter = new RateLimiterMemory(opts);

const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.urlencoded({extended: true}))
app.use(express.json())

let sessions, userCredentials, allShoppingCarts

app.get("/shoppingCart", (req, res) => {
    const userSession = userIsLoggedIn(req.headers.cookie)
    if(userSession === undefined || !userSession){
        const temporaryUserId = uuidv4();
        helper.createAnonymousSession(temporaryUserId, sessions)
        helper.createAnonymousShoppingCart(temporaryUserId, allShoppingCarts)
        saveSessions(); saveShoppingCarts();        
        res.set('Set-Cookie', `session=${temporaryUserId}`)
        return res.send(fetchAnonymousShoppingCart(temporaryUserId))
    }
    res.send(fetchAnonymousShoppingCart(req.headers.cookie.split("=")[1]))
})

app.get('/s', function(req,res){
    let query = helper.getQueryFromUrl(req.url)
    console.log(query)
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
    if(helper.hasOnlyNumbersAndLetters(phrase)){
        let searchSuggestions = helper.findSearchSuggestions(phrase)
        return res.send(searchSuggestions)
    }else{
        res.send("POST/suggestions: Invalid Characters")
    }
})

app.post('/addToCart', function(req,res){
    const sessionId = helper.cookieChecker(req.headers.cookie)
    if(sessionId === undefined)
        res.send("POST/addToCart: Invalid cookie.")

    const {productId, data, amount } = req.body
    
    if(helper.validateDataGiven(productId, data, amount)){
        let myCart = allShoppingCarts[sessionId].shoppingCart
        if(myCart === undefined){
            return res.status(200).send("Cart is not defined.")
        }
        let addedToExistingProductInCart = helper.incrementAmountOfExistingCartItem(myCart, productId, data, amount)
        if(addedToExistingProductInCart){
            saveShoppingCarts();
            return res.status(200).send("Added to existing cart item.")
        }else{
            let tempObject = helper.createNewObject(productId, data, amount)
            myCart.push(tempObject)
            saveShoppingCarts();
            return res.status(200).send("Added to cart.")
        }
    }else{
        return res.status(200).send("Invalid data provided.")
    }
    
})

app.post('/editCartItem', (req, res) => {
    const sessionId = helper.cookieChecker(req.headers.cookie)
    if(sessionId === undefined)
        res.send("POST/editCartItem: Invalid cookie.")

    const {productId, data, oldData, amount } = req.body
    if( 
        helper.validateDataGiven(productId, data, amount) && 
        helper.validateDataGiven(productId, oldData, amount)
    ){
        const myCart = allShoppingCarts[sessionId].shoppingCart
        if(myCart === undefined){
            return res.status(500).send("Cart not found.")
        }
        const status = helper.editFunction(myCart, productId, data, oldData, amount)
        saveShoppingCarts()
        return res.status(200).send(fetchAnonymousShoppingCart(sessionId))
    }else{
        return res.status(200).send("Invalid Data!")
    }
})

app.post('/deleteCartItem', (req, res) => {
    const sessionId = helper.cookieChecker(req.headers.cookie)
    if(sessionId === undefined){
        return res.send("POST/deleteCartItem: Invalid cookie.")
    }
    
    const {indexOfCartItem} = req.body

    let myCart = fetchAnonymousShoppingCart(sessionId).shoppingCart
    if(myCart === undefined){
        return res.status(200).send("POST/deleteCartItem: Cart is not defined.")
    }
    if(indexOfCartItem < 0 || indexOfCartItem >= myCart.length){
        return res.status(200).send("POST/deleteCartItem: Invalid Data.")
    }
    helper.deleteItemFromCart(myCart, indexOfCartItem)
    saveShoppingCarts()
    res.send(fetchAnonymousShoppingCart(sessionId))
})

app.post('/login', (req, res) => {
    const { username, password } = req.body
    const storedCreds = userCredentials.find((item) => item.user === username )
    if(storedCreds === undefined){
        console.log("POST/login: bad creds")
        res.status(200)
        return res.send("POST/login: Incorrect credentials. Please try again")
    }
    
    bcrypt.compare(password, storedCreds.pass, (err, result) => {
        if(err){
            console.log(err)
            return
        }
        if(result){    
            let arr = Object.keys(sessions)
            let isAlreadyLoggedIn = helper.checkIfUserIsLoggedIn(arr, sessions, username)
            if(isAlreadyLoggedIn){
                res.status(200)
                res.send("POST/login: Already logged in!")
            }
            if(!isAlreadyLoggedIn){
                deleteOldSession(req.headers.cookie.split("=")[1])
                deleteTempUserCart(req.headers.cookie.split("=")[1])
                const sessionId = helper.createLoggedInUserSession(sessions, username)
                saveSessions()
                res.set('Set-Cookie', `session=${sessionId}`)
                res.send("POST/login: Logged in successfuly!")
            }
            
        }else{
            console.log("POST/login: bad creds BECAUSE BCRYPT FAILED")
            return res.send("POST/login: Login failed.")
        }
    })
})

app.post("/register", (req,res) => {
    const { username, password } = req.body
    bcrypt.genSalt(saltRounds, function(err, salt) {
        if(err){
            console.log(err)
            return
        }
        bcrypt.hash(password, salt, function(err, hash) {
            if(err){
                console.log(err)
                return
            }
            userCredentials.push({user: username, pass: hash})
            let sessionId = helper.createLoggedInUserSession(sessions, username)
            allShoppingCarts[sessionId] = {type: "user", id: sessions[sessionId].userId, shoppingCart: []}    
            deleteTempUserCart(req.headers.cookie.split("=")[1])
            deleteOldSession(req.headers.cookie.split("=")[1])
            saveUserCredentials()
            saveSessions()
            res.set('Set-Cookie', `session=${sessionId}`)
            res.status(200)
            res.send("POST/register: Registered Successfully!")
        })
    });
})

app.post('/logout', (req,res) => {
    const sessionId = helper.cookieChecker(req.headers.cookie)
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

function userIsLoggedIn(cookie){
    if(cookie === undefined)
        return undefined
    let sessionId = cookie.split('=')[1]
    let userSession = sessions[sessionId]
    if(!userSession){
        console.log("USER SESSION NOT FOUND")
        return undefined
    }
    return userSession
}

function deleteOldSession(cookie){
    delete sessions[cookie]
    saveSessions()
}

function deleteTempUserCart(cookie){
    delete allShoppingCarts[cookie]
    saveShoppingCarts()
}
    
function fetchAnonymousShoppingCart(cookie){
    return allShoppingCarts[cookie]
}

app.listen(5000, console.log("Running on port 5000"), async()=>{
    userCredentials = await loadCreds()
    sessions = await loadSessions()
    allShoppingCarts = await loadAllShoppingCarts()
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

async function loadSessions(){
    let sessions = await loadFile('sessions.json') || {}
    return sessions
}
async function loadCreds(){
    let userCredentials = await loadFile('userCredentials.json') || []
    return userCredentials
}
async function loadAllShoppingCarts(){
    let allShoppingCarts = await loadFile('shoppingCarts.json') || {}
    return allShoppingCarts
}

function saveUserCredentials(){
    saveDataAsJSON('userCredentials.json', userCredentials)
}

function saveSessions(){
    saveDataAsJSON('sessions.json', sessions)
}

function saveShoppingCarts(){
    saveDataAsJSON('shoppingCarts.json', allShoppingCarts)
}

async function saveDataAsJSON(fileName, sourceVariable){
    fs.writeFile(fileName, JSON.stringify(sourceVariable), (err)=>{
        if (err) {
          console.error(err);
        }
    })
}