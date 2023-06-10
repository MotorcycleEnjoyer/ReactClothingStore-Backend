const dummyProductDB = require('./DummyProductDB')
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

function areIdentical(oldData, newData){
    let categories = Object.keys(oldData)
    let allMatch = true
    for(key of categories){
        if(newData[key] !== oldData[key])
        {
            allMatch = false
        }
    }    
    return allMatch
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
    if(array === null || array === undefined){
        console.log("NO ARRAY???")
        return []
    }
    if (!maxSize || maxSize > array.length) {
      maxSize = array.length;
    }
    let count = 0;
    let i = array.length - 1;
    // while ( count < maxSize && i < array.length ) {
    while ( count < maxSize && i >= 0 ) {
      if (condition(array[i])) {
        yield array[i];
        count++;
      }
      i--;
    }
  }

function findSearchSuggestions(searchTerm){
    let regex = genRegex(searchTerm)

    const suggestions = Array.from(
        limitedArrayPull(dummyProductDB.suggestions, i => i.match(regex), 10)
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

function createAnonymousSession(sessionId, sessionStorage){
    sessionStorage[sessionId] = {type: "anonymous"}
}

function createAnonymousShoppingCart(session, shoppingCartStorage){
    shoppingCartStorage.anonymousCarts[session] = {type: "anonymous", shoppingCart: []}
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

function deleteItemFromCart(cart, indexInCart){
    cart = cart.splice(indexInCart, 1)
}

function getIndexOfItemInCart(cart, productId, userData){
    const index = cart.findIndex(item => {
        if(item.details.id === productId){
            let allMatch = areIdentical(item.userSelectedParameters, userData)
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

function addToCart(cart, item){
    cart.push(item)
}

function createNewObject(productId, data, amount){
    let tempObject = getProductFromProductDatabase("NoName", productId)
    tempObject = {...tempObject, userSelectedParameters: {...data}, amount: parseInt(amount)}
    return tempObject
}

function validateDataGiven(productId, userChoices, amount){
    if(getProductFromProductDatabase("NONE", productId) === [])
    {
        console.error(`Product Id "${productId} is not within product database.`)
        return false
    }
    if(amount <= 0 || amount >= 21){
        console.error(`Amount ${amount} is invalid.`)
        return false
    }
    let size = userChoices.size
    let properSizes = ["S","M","L", "XL","XXL"]
    if(properSizes.indexOf(size) === -1){
        console.error(`Given size ${size} is invalid.`)
        return false
    }
    let sex = userChoices.sexCategory
    if(sex !== "M" && sex !== "F"){
        console.error(`Given sex "${sex}" is not in Size Chart!`)
        return false
    }
    let ageCategory = userChoices.ageCategory
    if(ageCategory !== "kids" && ageCategory !== "adults"){
        console.error(`Given ageCategory "${ageCategory}" not in Size Chart!`)
        return false
    }
    let color = userChoices.color
    let product = getProductFromProductDatabase("NONE", productId)
    if(product.details.colorOptions.indexOf(color) === -1){
        console.error(`The color "${color}" is invalid option for product: "${product.name}"`)
        return false
    }

    console.log("PASSED ALL CHECKS")
    return true
}

function userNameIsAvailable(username, allCredentials){
    const index = allCredentials.registeredUsers.findIndex((item) => {
        return item.username === username
    })
    return index === -1
}

function getUser(username, allCredentials) {
    return allCredentials.registeredUsers.filter(item => item.username === username)[0]
}

function getUserByCartId(cartId, allCredentials){
    return allCredentials.registeredUsers.filter(item => item.cartId === cartId)[0]
}

module.exports = 
{ findSearchSuggestions, getProductFromProductDatabase, createAnonymousSession, 
    createAnonymousShoppingCart, getQueryFromUrl, getProductIdFromUrl,
    hasOnlyNumbersAndLetters, incrementAmountOfExistingCartItem,
    validateDataGiven, deleteItemFromCart, createNewObject,
    userNameIsAvailable, limitedArrayPull, areIdentical, getUser, getUserByCartId
    }