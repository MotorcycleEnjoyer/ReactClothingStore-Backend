const express = require('express')
const app = express()
const uuidv4 = require('uuid').v4
const bcrypt = require('bcrypt')
const saltRounds = 12
const fs = require('fs')

app.use(express.json())
app.use(express.urlencoded({extended: true}))

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
async function loadSessions(){
    sessions = await loadFile('sessions.json') || {}
    console.log(sessions)
}
async function loadCreds(){
    userCredentials = await loadFile('userCredentials.json') || []
    console.log(userCredentials)
}

// dummy data
let allShoppingCarts = [
    {user: "admin", shoppingCart: [
        {id: 1, name: "potato", qty: 15, pricePerItem: 0.50},
        {id: 2, name: "bacon", qty: 5, pricePerItem: 7.99}
    ]},
    {user: "joe", shoppingCart: [
        {id: 1, name: "pistachio", qty: 23, pricePerItem: 25.0},
        {id: 2, name: "rabbits", qty: 5, pricePerItem: 15.99}
    ]}
]

app.get("/", (req, res) => {
    const userSession = userIsLoggedIn(req.headers.cookie)
    if(userSession === undefined || !userSession){
        const sessionId = uuidv4();
        sessions[sessionId] = {type: "anonymous-User"}
        saveSessions()
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
    const userSession = userIsLoggedIn(req.headers.cookie)
    if(userSession === undefined || !userSession){
        res.status(404)
        return res.send(`<h1>Error 404, page not found</h1>`)
    }
    else{
        let userCart = allShoppingCarts.find((cart) => cart.user === userSession.username)
        res.status(200)
        return res.send(userCart ||{error: "No shopping cart found" } )
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

function saveUserCredentials(){
    saveDataAsJSON('userCredentials.json', userCredentials)
}

function saveSessions(){
    saveDataAsJSON('sessions.json', sessions)
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