const dummyProductDB = require('./dummyProductDB')
const suggestionDB = require("./Suggestions")

function findSearchSuggestions(searchTerm){
    let regex
    try{
        regex = new RegExp(searchTerm, 'gi');
    }catch(e){
        console.error(e)
        return []
    }

    return(
        suggestionDB.filter(item => {
            return item.match(regex)
        })
    )
}

module.exports = { findSearchSuggestions }