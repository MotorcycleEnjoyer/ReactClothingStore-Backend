const express = require('express')
const app = express()
const uuidv4 = require('uuid').v4
const bcrypt = require('bcrypt')
const saltRounds = 12
const fs = require('fs')
const shoppingCartFunctions = require('./Shopping')

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

let sessions 
let userCredentials
let allShoppingCarts
async function loadSessions(){
    sessions = await loadFile('sessions.json') || {}
//    console.log(sessions)
}
async function loadCreds(){
    userCredentials = await loadFile('userCredentials.json') || []
//    console.log(userCredentials)
}
async function loadAllShoppingCarts(){
    allShoppingCarts = await loadFile('shoppingCarts.json') || {}
//    console.log(allShoppingCarts)
}

app.get("/", (req, res) => {
    const userSession = userIsLoggedIn(req.headers.cookie)
    if(userSession === undefined || !userSession){
        const sessionId = uuidv4();
        sessions[sessionId] = {type: "anonymous-User"}
        allShoppingCarts[sessionId] = {type: "anonymous-User", shoppingCart: [shoppingCartFunctions.dummyProduct]}
        saveSessions()
        saveShoppingCarts()
        res.set('Set-Cookie', `session=${sessionId}`)
    }
    return res.sendFile('/logged-in.html', {root: __dirname})
})

app.get("/login", (req, res) => {
    // showCreds()
    const userSession = userIsLoggedIn(req.headers.cookie)
    if(userSession === undefined || !userSession){
        res.sendFile('/login.html', {root: __dirname}) 
    }
    else{
        res.redirect("/")
    }
    
})

app.get('/register', (req, res) => {
    const userSession = userIsLoggedIn(req.headers.cookie)
    if(userSession === undefined || !userSession){
        return res.sendFile('/register.html', {root: __dirname})
    }
    else{
        res.redirect("/")
    }
})

app.get('/todos',(req, res) => {
    const userSession = userIsLoggedIn(req.headers.cookie)
    if(userSession === undefined || !userSession){
        return res.redirect("/login")
    }

    const userId = userSession.userId
    res.send([{
        id: 1,
        title: 'Learn Node',
        userId,
    }])

})

app.get("/data", (req, res) => {
/*     const userSession = userIsLoggedIn(req.headers.cookie)
    if(userSession === undefined || !userSession){
        res.status(404)
        return res.send(`<h1>Error 404, page not found</h1>`)
    }
    else{
        //let userCart = allShoppingCarts.find((cart) => cart.user === userSession.username)
        // res.status(200)
        return res.send({error: "No shopping cart found" })
    } */
    let rawCookie = req.headers.cookie
    if(rawCookie === undefined || !rawCookie)
    {
        res.status(404)
        return res.send(`<h1>Error 404, page not found</h1>`)
    }else{
        let sessionId = rawCookie.split('=')[1]
        return res.send(fetchUserShoppingCart(sessionId))
    }
})

app.post('/login', (req, res) => {
    
    const { username, password } = req.body
    const storedCreds = userCredentials.find((item) => item.user === username )
    if(storedCreds === undefined){
        console.log("bad creds")
        return res.sendFile('/login-try-again.html', {root: __dirname})
    }
    
    bcrypt.compare(password, storedCreds.pass, (err, result) => {
        if(err){
            console.log(err)
            return
        }
        if(result){    
            let arr = Object.keys(sessions)
            let isAlreadyLoggedIn = false
           /*  console.log("KEYS ARRAY:")
            console.log(arr)
            console.log("KEYS END!!!") */
            arr.forEach((item) => {
                console.log(`${sessions[item].username}`)
                if(sessions[item].username === (username)){
                    console.log(`The user ${sessions[item].username} is already logged in right now.`)
                    isAlreadyLoggedIn = true
                    return
                }
            })
    
            if(isAlreadyLoggedIn){
                res.status(500)
                res.send("User already has an active session.")
            }
            if(!isAlreadyLoggedIn){
                const sessionId = uuidv4();
                sessions[sessionId] = { username, userId: 1}
                saveSessions()
                res.set('Set-Cookie', `session=${sessionId}`)
                res.redirect('/')
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
            sessions[sessionId] = { username, userId: 1}
            saveUserCredentials()
            saveSessions()
            res.set('Set-Cookie', `session=${sessionId}`)
            res.redirect('/')
        })
    });
})

app.post('/cart', (req, res) => {
    const cookie = req.headers.cookie
    if(cookie === undefined){
        res.status(404)
        res.send(`<h1>Error 404, page not found</h1>`)
    }
    
    const sessionId = cookie.split('=')[1]
    if(sessionId === undefined){
        res.status(404)
        res.send(`<h1>Error 404, page not found</h1>`)
    }

    let myCart = allShoppingCarts[sessionId].shoppingCart
    let product = req.body.product
    shoppingCartFunctions.addToCart(myCart, product)
    console.log(myCart)
    return res.send(fetchUserShoppingCart(sessionId))
})

app.post('/logout', (req,res) => {
    const cookie = req.headers.cookie
    if(cookie === undefined){
        res.status(404)
        res.send(`<h1>Error 404, page not found</h1>`)
    }
    
    const sessionId = cookie.split('=')[1]
    if(sessionId === undefined){
        res.status(404)
        res.send(`<h1>Error 404, page not found</h1>`)
    }
        delete sessions[sessionId]
        saveSessions()
        res.set('Set-Cookie', 'session=; expires=Thu, 01 Jan 1970 00:00:00 GMT') 
        res.redirect("/")
/* 
    console.log(sessions)
    delete userSession
    console.log(sessions)
    res.set('Set-Cookie', 'session=; expires=Thu, 01 Jan 1970 00:00:00 GMT') 
    res.redirect("/") */
})

// 404 handler
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
        return undefined
    }
    return userSession
}

function fetchUserShoppingCart(cookie){
//    console.log(`Cookie: ${cookie}`)
//    console.log(allShoppingCarts[cookie])
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