const mongoose = require("mongoose")

const anonymousCartSchema = new mongoose.Schema({
    temporaryAnonCookie: String,
    shoppingCart: []
})
const AnonModel = new mongoose.model("AnonCart", anonymousCartSchema)

async function createAndReturnUser(userDetails) {
    const person = new AnonModel(userDetails)
    await person.save()
    return person
}

async function getUser(temporaryAnonCookie){
    const person = await AnonModel.findOne({temporaryAnonCookie})
    return person
}

async function getAllUsers(){
    const everyone = await AnonModel.find({})
    return everyone
}

async function addToCart(newProduct, temporaryAnonCookie){
    const user = await getUser(temporaryAnonCookie)
    let tempArr = user.shoppingCart

    const indexOfIdenticalMatch = tempArr.findIndex((item) => {
        if (item.details.id === newProduct.details.id)
            if (areIdentical(item.userSelectedParameters, newProduct.userSelectedParameters)) { 
                return item
            }
    })
    if( indexOfIdenticalMatch === -1) {
        tempArr.push(newProduct)
        user.shoppingCart = tempArr
    } else {
        tempArr[indexOfIdenticalMatch].amount += newProduct.amount
        user.shoppingCart[indexOfIdenticalMatch] = tempArr[indexOfIdenticalMatch]
    }
    await user.save()
    return user.shoppingCart
}

async function deleteCartItem(indexToDelete, temporaryAnonCookie){
    let user = await getUser(temporaryAnonCookie)
    if(indexToDelete < 0 || indexToDelete >= user.shoppingCart.length){
        return user.shoppingCart
    }
    let tempArr = user.shoppingCart.filter((item, index) => {
        return index !== indexToDelete && item
    })
    user.shoppingCart = tempArr
    await user.save()
    return user.shoppingCart
}

function areIdentical(oldData, newData){
    let categories = Object.keys(oldData)
    let allMatch = true
    for(const key of categories){
        if(newData[key] !== oldData[key])
        {
            allMatch = false
        }
    }    
    return allMatch
}

async function editCartItem (dataObject, temporaryAnonCookie) {
    let user = await getUser(temporaryAnonCookie)
    const { productId, oldUserChoices, newUserChoices, index, amount } = dataObject
    if(index < 0 || index >= user.shoppingCart.length){
        return user.shoppingCart
    }
    let tempArr = user.shoppingCart

    // setting amount to different value, on source item
    if (areIdentical(oldUserChoices, newUserChoices)) {
        user.shoppingCart[index].amount = amount
        await user.save()
        return user.shoppingCart
    } else {
        const indexOfIdenticalMatch = tempArr.findIndex((item) => {
            if (item.details.id === productId)
                if (areIdentical(item.userSelectedParameters, newUserChoices)) { 
                    return item
                }
        })
        const itemExistsInAnotherIndex = indexOfIdenticalMatch !== -1
        if( itemExistsInAnotherIndex ) {
            // incrementing amount of a DIFFERENT ITEM than source item
            tempArr[indexOfIdenticalMatch].amount += amount
        } else {
            // CREATING NEW ITEM, because sourceItem and allother did not match with parameters
            const dataObject = { ...dummyProductDB.db.filter(item => item.details.id === productId)[0], userSelectedParameters: newUserChoices, amount: amount }
            tempArr.push(dataObject)
        }
        // DELETE SOURCE ITEM, because we moved that data into a different object now.
        tempArr = tempArr.filter((item, filterIndex) => {
            if ( filterIndex !== index ) {
                return item
            }
        })
        user.shoppingCart = tempArr
        await user.save()
        return user.shoppingCart
    }
}

async function deleteAnon (temporaryAnonCookie) {
    if(temporaryAnonCookie === null)
        return null
    
    const result = await AnonModel.deleteOne({ temporaryAnonCookie })
    return result.deletedCount === 1
}



module.exports = {getUser, createAndReturnUser, getAllUsers, deleteAnon, addToCart, deleteCartItem, editCartItem}