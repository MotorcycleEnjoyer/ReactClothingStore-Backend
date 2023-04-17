const mongoose = require("mongoose")
const uuidv4 = require('uuid').v4
const dummyProductDB = require('./dummyProductDB')
const User = require("./databaseLogic/User")
const AnonUser = require("./databaseLogic/Anonymous")

async function connectToDatabase (location) {
    try {
        await mongoose.connect(location);
      } catch (error) {
        return false
      }
    return true
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
    const { temporaryAnonCookie, username } = idOrAnonCookieOrUsername
    let user = null

    if (username !== undefined) {
        user = await User.getUser(username)
    } else if (temporaryAnonCookie !== undefined) {
        user = await AnonUser.getUser(temporaryAnonCookie)
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
    const anon = await AnonUser.createAndReturnUser(args)
    return anon
}

async function createUserAndDeleteAnon (userCredentials, temporaryAnonCookie) {
    const { username, password } = userCredentials
    if(!username || !password || !temporaryAnonCookie) {
        throw new Error("Undefined Credentials!")
    } else {
        const payload = {
            username, 
            password,
            reviews: [],
            shoppingCart: [],
            purchaseHistory: []
        }
        const newUser = await User.createAndReturnUser(payload)
        await AnonUser.deleteAnon({ temporaryAnonCookie })
        return newUser
    }
}

async function addItemToMongoCart(product, credentials) {
    const { temporaryAnonCookie, username } = credentials
    if (!product) {
        throw new Error("Can't add nothing to cart... Pick an item!")
    }

    if (!username) {
        if (!temporaryAnonCookie) {
            throw new Error("Can't add to nobody's cart. Be a user next time!")
        } else {
            await AnonUser.addToCart(product, { temporaryAnonCookie })
        }
    } else {
        await User.addToCart(product, { username })
    }
}

async function editItemInMongoCart (payload, credentials) {
    const { username, temporaryAnonCookie } = credentials

    if (!username) {
        if (!temporaryAnonCookie) {
            throw new Error("Can't add to nobody's cart. Be a user next time!")
        } else {
            await AnonUser.editCartItem(payload, { temporaryAnonCookie })
        }
    } else {
        await User.editCartItem(payload, { username })
    }
}

async function deleteItemInMongoCart (index, credentials) {
    const { temporaryAnonCookie, username } = credentials
    if (!index) {
        throw new Error("Can't delete an unspecified index... Pick an item!")
    }

    if (!username) {
        if (!temporaryAnonCookie) {
            throw new Error("Can't delete if no account...")
        } else {
            await AnonUser.deleteCartItem(index, { temporaryAnonCookie })
        }
    } else {
        await User.deleteCartItem(index, { username })
    }
}

module.exports = { createUserAndDeleteAnon, createAnon, editItemInMongoCart,
    connectToDatabase, getUser, addItemToUserReview, getAllReviewsForProduct,
    clearCartInMongo, deleteItemInMongoCart, addItemToMongoCart }