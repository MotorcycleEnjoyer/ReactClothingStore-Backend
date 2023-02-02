const dummyProductDB = require('./dummyProductDB')
const suggestionDB = require("./Suggestions")

function genRegex(searchTerm)
{   
    let regex
    try{
        regex = new RegExp(searchTerm, 'gi');
    }catch(e){
        console.error(e)
        return
    }
    return regex
}

function findSearchSuggestions(searchTerm){
    let regex = genRegex(searchTerm)
    return(
        suggestionDB.filter(item => item.match(regex))
    )
}

function getProductFromProductDatabase(productName, productId){
    if(productId === undefined){
        let regex = genRegex(productName)
    return(
        dummyProductDB.db.filter(item => item.name.match(regex))
    )
    }else{
        return dummyProductDB.db.filter(item => item.id === productId)[0]
    }
}

function cookieChecker(cookie){
    if(cookie === undefined){
        return undefined
    }

    const sessionId = cookie.split("=")[1]
    if(sessionId === undefined){
        return undefined
    }
    return sessionId
}

function createAnonymousSession(sessionId, sessionStorage){
    sessionStorage[sessionId] = {type: "anonymous-User"}
}

function createAnonymousShoppingCart(session, shoppingCartStorage){
    shoppingCartStorage[session] = {type: "anonymous-User", shoppingCart: []}
}

function getQueryFromUrl(urlData){
    let urlObject = url.parse(urlData)
    let rawQuery = urlObject.query.split("=")[1]
    return rawQuery.split("+").join(" ")
}

function getProductIdFromUrl(urlData){
    let urlObject = url.parse(req.url)
    return parseInt(urlObject.href.split("id/")[1])
}

function checkIfUserIsLoggedIn(arr, sessions){
    arr.forEach((item) => {
        console.log(`${sessions[item].username}`)
        if(sessions[item].username === (username)){
            console.log(`The user ${sessions[item].username} is already logged in right now.`)
            return true
        }
    })
    return false
}


module.exports = 
{ findSearchSuggestions, getProductFromProductDatabase, cookieChecker, createAnonymousSession, 
    createAnonymousShoppingCart, getQueryFromUrl, getProductIdFromUrl,
    }