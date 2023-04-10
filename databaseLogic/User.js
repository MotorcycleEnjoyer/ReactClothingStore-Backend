const mongoose = require("mongoose")

const userDataSchema = new mongoose.Schema({
    username: String,
    password: String,
    reviews: [{ 
        productId: Number, 
        review: String, 
        rating: Number
    }],
    shoppingCart: []
})
const UserModel = mongoose.model('UserData', userDataSchema)

async function createAndReturnUser(userDetails) {
    const person = new UserModel(userDetails)
    await person.save()
    return person
}

async function getUser(username){
    const person = await UserModel.findOne({username})
    return person
}

async function getAllUsers(){
    const everyone = await UserModel.find({})
    return everyone
}

async function addToCart(newProduct, username){
    const user = await getUser(username)
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

async function deleteCartItem(indexToDelete, username){
    let user = await getUser(username)
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

module.exports = {getUser, createAndReturnUser, getAllUsers, addToCart, deleteCartItem}