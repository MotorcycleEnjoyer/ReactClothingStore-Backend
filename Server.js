const express = require('express')
const app = express()
const uuidv4 = require('uuid').v4
const bcrypt = require('bcrypt')
const saltRounds = 12
const fs = require('fs')
const url = require('url')
const shoppingCartFunctions = require('./Shopping')
const cors = require("cors")
const helper = require("./helper")

const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.urlencoded({extended: true}))
app.use(express.json())

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

let sessions, userCredentials, allShoppingCarts
async function loadSessions(){
    sessions = await loadFile('sessions.json') || {}
}
async function loadCreds(){
    userCredentials = await loadFile('userCredentials.json') || []
}
async function loadAllShoppingCarts(){
    allShoppingCarts = await loadFile('shoppingCarts.json') || {}
}

app.get("/shoppingCart", (req, res) => {
    const userSession = userIsLoggedIn(req.headers.cookie)
    if(userSession === undefined || !userSession){
        const temporaryUserId = uuidv4();
        sessions[temporaryUserId] = {type: "anonymous-User"}
        allShoppingCarts[temporaryUserId] = {type: "anonymous-User", shoppingCart: [shoppingCartFunctions.dummyProduct]}
        saveSessions()
        saveShoppingCarts()
        res.set('Set-Cookie', `session=${temporaryUserId}`)
        res.send(fetchAnonymousShoppingCart(temporaryUserId))
    }
    res.send(fetchAnonymousShoppingCart(req.headers.cookie.split("=")[1]))
})

app.get('/s', function(req,res){
    let urlObject = url.parse(req.url)
    let rawQuery = urlObject.query.split("=")[1]
    let properQuery = rawQuery.split("+").join(" ")
    let searchResults = helper.getProductFromProductDatabase(properQuery)
    res.send(searchResults)
})

app.get('/p/*/id/*', function(req,res){
    let urlObject = url.parse(req.url)
    let productID = parseInt(urlObject.href.split("id/")[1])
    let searchResults = helper.getProductFromProductDatabase("NoName", productID)
    res.send(searchResults)
})

app.post('/suggestions', function(req,res){
    let phrase = req.body.searchTerm
    let searchSuggestions = helper.findSearchSuggestions(phrase)
    res.send(searchSuggestions)
})

app.post('/addToCart', function(req,res){
    const sessionId = helper.cookieChecker(req.headers.cookie)
    if(sessionId === undefined)
        res.send("Invalid cookie.")

    let myCart = allShoppingCarts[sessionId].shoppingCart
    let userSubmittedOptions = req.body.data
    let productID = req.body.productId
    let tempObject = helper.getProductFromProductDatabase("NoName", productID)
    tempObject = {...tempObject, ...userSubmittedOptions}
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
            let isAlreadyLoggedIn = false
            arr.forEach((item) => {
                console.log(`${sessions[item].username}`)
                if(sessions[item].username === (username)){
                    console.log(`The user ${sessions[item].username} is already logged in right now.`)
                    isAlreadyLoggedIn = true
                    res.status(200)
                    res.send("User already has an active session.")
                }
            })
            if(!isAlreadyLoggedIn){
                deleteOldSession(req.headers.cookie.split("=")[1])
                deleteTempUserCart(req.headers.cookie.split("=")[1])
                const sessionId = uuidv4();
                sessions[sessionId] = { username, userId: 1}
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
            console.lop(err)
            return
        }
        bcrypt.hash(password, salt, function(err, hash) {
            console.timeEnd("bcrypt my implementaiton")
            if(err){
                console.log(err)
                return
            }

            userCredentials.push({user: username, pass: hash})
            const sessionId = uuidv4();
            sessions[sessionId] = { type:"user", user: username, userId: 1}
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

app.listen(5000, console.log("Running on port 5000"))
loadCreds()
loadSessions()
loadAllShoppingCarts()