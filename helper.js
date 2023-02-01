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
        return dummyProductDB.db.filter(item => item.id === productId)
    }
}

module.exports = { findSearchSuggestions, getProductFromProductDatabase}