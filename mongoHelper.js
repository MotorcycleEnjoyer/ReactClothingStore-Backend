const mongoose = require("mongoose")
const uuidv4 = require('uuid').v4

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

const anonymousCartSchema = new mongoose.Schema({
    temporaryAnonCookie: String,
    shoppingCart: []
})
const AnonModel = new mongoose.model("AnonCart", anonymousCartSchema)

const ratingsAndReviewsSchema = new mongoose.Schema({
    allReviews: [
        { 
            productId: Number, 
            reviewArray: [String],
            ratingArray: [Number]
        }
    ],
})
const FeedbackModel = new mongoose.model("feedback", ratingsAndReviewsSchema)

async function connectToDatabase (location) {
    const weAreConnected = mongoose.connect(location)
    return weAreConnected !== null
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

async function getMongoCart (_id) {
    let user = await UserModel.findById( { _id } )
    return user.shoppingCart
}

async function getUser (idOrAnonCookie) {
    const { _id, temporaryAnonCookie } = idOrAnonCookie
    let user = null
    if (temporaryAnonCookie === undefined) {
        user = await UserModel.findById( { _id } )
    } else {
        user = await AnonModel.findOne( { temporaryAnonCookie })
    }
    return user
}

async function addItemToUserReview (newReview, idOrAnonCookie) {
    let user = await getUser(idOrAnonCookie)
    let tempArr = user.reviews
    let indexOfExistingReview = tempArr.findIndex((item) => {
        if (item.productId === newReview.productId) {
            return item
        }
    })
    if (indexOfExistingReview === -1) {
        user.reviews.push(newReview)
    } else {
        Object.entries(newReview).forEach(([key, value]) => {
            user.reviews[indexOfExistingReview][key] = value
        })
    }
    await user.save()
    return user
}

async function addItemToMongoCart (newProduct, idOrAnonCookie) {
    let user = await getUser(idOrAnonCookie)
    let tempArr = user.shoppingCart

    const indexOfIdenticalMatch = tempArr.findIndex((item) => {
        if (areIdentical(item, newProduct)) { 
            return item
        }
    })
    if( indexOfIdenticalMatch === -1) {
        tempArr.push(newProduct)
    } else {
        tempArr[indexOfIdenticalMatch].amount += newProduct.amount
    }

    user.shoppingCart = tempArr
    await user.save()
    return user.shoppingCart
}

async function editItemInMongoCart (indexToChange, productWithDifferentChoices, idOrAnonCookie) {
    let user = await getUser(idOrAnonCookie)
    console.log(user)
    let tempArr = user.shoppingCart.map((item, index) => {
        return index === indexToChange ? productWithDifferentChoices : item
    })
    console.log(tempArr)

    user.shoppingCart = tempArr
    await user.save()
    return user.shoppingCart
}

async function deleteItemInMongoCart (indexToDelete, idOrAnonCookie) {
    let user = await getUser(idOrAnonCookie)
    let tempArr = user.shoppingCart.filter((item, index) => {
        return index !== indexToDelete && item
    })
    user.shoppingCart = tempArr
    await user.save()
    return user.shoppingCart
}

async function createAnon () {
    const args = {
        temporaryAnonCookie: uuidv4(),
        shoppingCart: []
    }
    const anon = await createAndSaveRecord(AnonModel, args)
    return anon
}

async function createUserAndDeleteAnon (userCredentials, temporaryAnonCookie) {
    await AnonModel.deleteOne({ temporaryAnonCookie })
    const { username, password } = userCredentials
    const userRecord = await createAndSaveRecord(UserModel, {
        username, 
        password,
        reviews: [],
        shoppingCart: []
    })
    return userRecord
}

async function createAndSaveRecord (mongoModel, newParameters) {
    const record = new mongoModel(newParameters)
    await record.save()
    return record
}

module.exports = { createAndSaveRecord, createUserAndDeleteAnon, createAnon, 
    deleteItemInMongoCart, editItemInMongoCart, addItemToMongoCart,
    getMongoCart, connectToDatabase, getUser, addItemToUserReview }