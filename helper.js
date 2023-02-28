const dummyProductDB = require('./dummyProductDB')
const suggestionDB = require("./Suggestions")
const uuidv4 = require('uuid').v4
const url = require("url")
const blockedCharacters = new RegExp("[~`!@#$%^&()_={}\\[\\]\\:;,\\.\\/<>\\\\*\\-+\\?]")

function hasOnlyNumbersAndLetters(value){
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
        const products = Array.from(
            limitedArrayPull(dummyProductDB.db, i => i.details.name.match(regex), 10)
        )
        return(products)
    }else{
        return dummyProductDB.db.filter(item => item.details.id === productId)[0]
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

function editItemInCart(cart, productId, newData, oldData, amount){
    let index = getIndexOfItemInCart(cart, productId, oldData)
    if(index === -1){
        return false
    }else{
        cart[index] = {...cart[index], userSelectedParameters: {...newData}, amount: amount}
        return true
    }
}

function deleteItemFromCart(cart, indexInCart){
    cart = cart.splice(indexInCart, 1)
}

function getIndexOfItemInCart(cart, productId, userData){
    const index = cart.findIndex(item => {
        if(item.details.id === productId){
            let categories = Object.keys(userData)
            let allMatch = true
            for(key of categories){
                if(userData[key] !== item.userSelectedParameters[key])
                {
                    allMatch = false
                }
            }
            if(allMatch){
                return item
            } 
            }
        }
    )
    return index
}

function incrementAmountOfExistingCartItem(cart, productId, userData, amount){
    let index = getIndexOfItemInCart(cart, productId, userData)

    if(index === -1){
        return false
    }
    else{
        cart[index].amount += parseInt(amount)
        return true
    }
}

function setAmountOfExistingCartItem(cart, productId, userData, amount){
    let index = getIndexOfItemInCart(cart, productId, userData)

    if(index === -1){
        return false
    }
    else{
        cart[index].amount = parseInt(amount)
        return true
    }
}

function validateDataGiven(productId, dataObject, amount){
/*     let dataKeys = Object.keys(dataObject)
    for(key of dataKeys){
        
    } */
    if(getProductFromProductDatabase("NONE", productId) === [])
    {
        console.error(`Product Id "${productId} is not within product database.`)
        return false
    }
    if(amount <= 0 || amount >= 21){
        console.error(`Amount ${amount} is invalid.`)
        return false
    }
    let size = dataObject.size
    let properSizes = ["S","M","L", "XL","XXL"]
    if(properSizes.indexOf(size) === -1){
        console.error(`Given size ${size} is invalid.`)
        return false
    }
    let sex = dataObject.sexCategory
    if(sex !== "M" && sex !== "F"){
        console.error(`Given sex "${sex}" is not in Size Chart!`)
        return false
    }
    let ageCategory = dataObject.ageCategory
    if(ageCategory !== "kids" && ageCategory !== "adults"){
        console.error(`Given ageCategory "${ageCategory}" not in Size Chart!`)
        return false
    }
    let color = dataObject.color
    let product = getProductFromProductDatabase("NONE", productId)
    if(product.details.colorOptions.indexOf(color) === -1){
        console.error(`The color "${color}" is invalid option for product: "${product.name}"`)
        return false
    }

    console.log("PASSED ALL CHECKS")
    return true
}

module.exports = 
{ findSearchSuggestions, getProductFromProductDatabase, cookieChecker, createAnonymousSession, 
    createAnonymousShoppingCart, getQueryFromUrl, getProductIdFromUrl, checkIfUserIsLoggedIn,
    createLoggedInUserSession, hasOnlyNumbersAndLetters, incrementAmountOfExistingCartItem,
    validateDataGiven, editItemInCart, deleteItemFromCart, getIndexOfItemInCart,
    setAmountOfExistingCartItem
    }