const dummyProductDB = require('./dummyProductDB')
const suggestionDB = require("./Suggestions")
const uuidv4 = require('uuid').v4
const url = require("url")
const blockedCharacters = new RegExp("[~`!@#$%^&()_={}\\[\\]\\:;,\\.\\/<>\\\\*\\-+\\?]")
const MAX_SUGGESTION_LENGTH = 10

function isOnlyNumbersAndLetters(value){
    if(blockedCharacters.test(value)){
        console.log("INVALID REGEX CHARS SPOTTED") 
        return false
    }else{
        return true
    }
}

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

// Credit to Icepickle on StackOverflow
// URL: https://stackoverflow.com/questions/56168771/how-to-limit-for-10-results-the-array-filter
function* limitedArrayPull(array, condition, maxSize) {
    if (!maxSize || maxSize > array.length) {
      maxSize = array.length;
    }
    let count = 0;
    let i = 0;
    while ( count < maxSize && i < array.length ) {
      if (condition(array[i])) {
        yield array[i];
        count++;
      }
      i++;
    }
  }

function findSearchSuggestions(searchTerm){
    let regex = genRegex(searchTerm)

    const suggestions = Array.from(
        limitedArrayPull(suggestionDB, i => i.match(regex), 10)
    )

    console.log(suggestions)
    return suggestions
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
    let urlObject = url.parse(urlData)
    return parseInt(urlObject.href.split("id/")[1])
}

function checkIfUserIsLoggedIn(arr, sessions, username){
    let isLoggedIn = false

    arr.every((item) => {
        if(sessions[item].username === (username)){
            isLoggedIn = true
        }
        if(isLoggedIn)
            return false
        
        return true
    })
    
    return isLoggedIn
}

function createLoggedInUserSession(sessions, user){
    const sessionId = uuidv4();
    sessions[sessionId] = { type:"user", username: user, userId: 1}
    return sessionId
}

module.exports = 
{ findSearchSuggestions, getProductFromProductDatabase, cookieChecker, createAnonymousSession, 
    createAnonymousShoppingCart, getQueryFromUrl, getProductIdFromUrl, checkIfUserIsLoggedIn,
    createLoggedInUserSession, isOnlyNumbersAndLetters
    }