const express = require('express')
const app = express()
const uuidv4 = require('uuid').v4
const bcrypt = require('bcrypt')
const saltRounds = 12
const fs = require("fs")
const shoppingCartFunctions = require('./Shopping')
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
    if(helper.isOnlyNumbersAndLetters(query)){
        let searchResults = helper.getProductFromProductDatabase(query)
        return res.send(searchResults)
    }else{
        res.send("INVALID SEARCH TERMS!!!")
    }
    
})

app.get('/p/*/id/*', function(req,res){
    rateLimiter.consume(req.headers.cookie, 2) // consume 2 points
      .then((rateLimiterRes) => {
        // 2 points consumed
        let productId = helper.getProductIdFromUrl(req.url)
        let searchResults = helper.getProductFromProductDatabase("NoName", productId)
        return res.send(searchResults)
      })
      .catch((rateLimiterRes) => {
        // Not enough points to consume
        return res.send("TOO MANY REQUESTS! SLOW DOWN!")
      });
    
})

app.post('/suggestions', function(req,res){
    let phrase = req.body.searchTerm
    if(helper.isOnlyNumbersAndLetters(phrase)){
        let searchSuggestions = helper.findSearchSuggestions(phrase)
        return res.send(searchSuggestions)
    }else{
        res.send("Invalid Characters")
    }
})

app.post('/addToCart', function(req,res){
    const sessionId = helper.cookieChecker(req.headers.cookie)
    if(sessionId === undefined)
        res.send("Invalid cookie.")

    const {productId, data } = req.body
    let myCart = allShoppingCarts[sessionId].shoppingCart
    let tempObject = helper.getProductFromProductDatabase("NoName", productId)
    tempObject = {...tempObject, ...data}
    shoppingCartFunctions.addToCart(myCart, tempObject)
    res.send("ok")
})

app.post('/login', (req, res) => {
    const { username, password } = req.body
    const storedCreds = userCredentials.find((item) => item.user === username )
    if(storedCreds === undefined){
        console.log("bad creds")
        res.status(200)
        return res.send("Incorrect credentials. Please try again")
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
                res.send("Already logged in!")
            }
            if(!isAlreadyLoggedIn){
                deleteOldSession(req.headers.cookie.split("=")[1])
                deleteTempUserCart(req.headers.cookie.split("=")[1])
                const sessionId = helper.createLoggedInUserSession(sessions, username)
                saveSessions()
                res.set('Set-Cookie', `session=${sessionId}`)
                res.send("Logged in successfuly!")
            }
            
        }else{
            console.log("bad creds BECAUSE BCRYPT FAILED")
            return res.sendFile('/login-try-again.html', {root: __dirname})
        }
    })
})

app.post("/register", (req,res) => {
    const { username, password } = req.body
    console.time("bcrypt my implementaiton")
    bcrypt.genSalt(saltRounds, function(err, salt) {
        if(err){
            console.log(err)
            return
        }
        bcrypt.hash(password, salt, function(err, hash) {
            console.timeEnd("bcrypt my implementaiton")
            if(err){
                console.log(err)
                return
            }
            userCredentials.push({user: username, pass: hash})
            let sessionId = helper.createLoggedInUserSession(sessions, username)
            allShoppingCarts[sessionId] = {type: "user", id: sessions[sessionId].userId, shoppingCart: [shoppingCartFunctions.dummyProduct]}    
            deleteTempUserCart(req.headers.cookie.split("=")[1])
            deleteOldSession(req.headers.cookie.split("=")[1])
            saveUserCredentials()
            saveSessions()
            res.set('Set-Cookie', `session=${sessionId}`)
            res.status(200)
            res.send("Registered Successfully!")
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
        return res.send("You are not logged in!")
    }
    
    saveSessions()
    res.set('Set-Cookie', 'session=; expires=Thu, 01 Jan 1970 00:00:00 GMT') 
    res.send("Logged out successfully!")
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