const mongoose = require("mongoose")
const uuidv4 = require('uuid').v4
const helper = require("./helper")

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
    productId: Number, 
    reviewArray: [String],
    ratingArray: [Number]
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

async function getAllReviewsForProduct (productObj) {
    const {productId} = productObj
    console.log(`Product id is: [${productId}]`)
    const feedback = await FeedbackModel.findOne({ productId })
    console.log(`Feedback is: [${feedback}]`)
    return feedback
}

async function getUser (idOrAnonCookieOrUsername) {
    const { _id, temporaryAnonCookie, username } = idOrAnonCookieOrUsername
    let user = null

    if (username !== undefined) {
        user = await UserModel.findOne({ username: username })
    } else if (temporaryAnonCookie !== undefined) {
        user = await AnonModel.findOne( { temporaryAnonCookie })
    } else if (_id !== undefined){
        user = await UserModel.findById( { id: _id } )
    }
    return user
}

async function addReviewToMainArray (newReview) {
    const {productId, review, rating} = newReview
    const allReviewsForProduct = await getAllReviewsForProduct({ productId })
    if (allReviewsForProduct === null){
        const dataObject = {
            productId: productId,
            reviewArray: (review === undefined || review === null) ? [] : [ review ],
            ratingArray: (rating === undefined || rating === null) ? [] : [ rating ]
        }
        await createAndSaveRecord(FeedbackModel, dataObject)
        return
    } else {
        if (rating !== undefined && rating !== null) {
            allReviewsForProduct.ratingArray.push(rating)
        }
        if (review !== undefined && review !== null) {
            allReviewsForProduct.reviewArray.push(review)
        }
        await allReviewsForProduct.save()
        return
    }
}

async function addItemToUserReview (newReview, idOrAnonCookie) {    
    const user = await getUser({ username: idOrAnonCookie })
    let tempArr = user.reviews
    const {productId, review, rating} = newReview
    let indexOfExistingReview = tempArr.findIndex((item) => {
        if (item.productId === productId) {
            return item
        }
    })
    if (indexOfExistingReview === -1) {
        user.reviews.push({
            productId: productId,
            review: review === undefined ? null : review,
            rating: rating === undefined ? null : rating
        })
        await addReviewToMainArray(newReview)
        await user.save()
        return true
    } else {
        if (rating !== undefined && rating !== null) {
            user.reviews[indexOfExistingReview].rating = rating
        }
        if (review !== undefined && review !== null) {
            user.reviews[indexOfExistingReview].review = review
        }
        await user.save()
        await addReviewToMainArray(newReview)
        return false
    }
}

async function addItemToMongoCart (newProduct, idOrAnonCookie) {
    let user = await getUser(idOrAnonCookie)
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

async function editItemInMongoCart (dataObject, idOrAnonCookie) {
    let user = await getUser(idOrAnonCookie)
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
            const dataObject = { ...helper.getProductFromProductDatabase(null, productId), userSelectedParameters: newUserChoices, amount: amount }
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

async function deleteItemInMongoCart (indexToDelete, idOrAnonCookie) {
    let user = await getUser(idOrAnonCookie)
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

async function clearCartInMongo (idOrAnonCookie) {
    let user = await getUser(idOrAnonCookie)
    user.shoppingCart = []
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

async function deleteAnon (cookie) {
    const { temporaryAnonCookie } = cookie
    if(temporaryAnonCookie === null)
        return null
    
    const result = await AnonModel.deleteOne({ temporaryAnonCookie })
    return result.deletedCount === 1
}

async function createUserAndDeleteAnon (userCredentials, temporaryAnonCookie) {
    const { username, password } = userCredentials
    AnonModel.deleteOne({ temporaryAnonCookie })
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
    connectToDatabase, getUser, addItemToUserReview, getAllReviewsForProduct,
    clearCartInMongo, deleteAnon }