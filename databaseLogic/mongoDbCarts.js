const mongoose = require("mongoose");
const { dummyProducts } = require("../DummyProductDB");

async function connectToDatabase(location) {
    try {
        await mongoose.connect(location);
    } catch (error) {
        return false;
    }
    return true;
}

const GuestCartSchema = new mongoose.Schema({
    sessionToken: {
        type: String,
        required: true,
    },
    loginStatus: {
        type: String,
        required: true,
    },
    shoppingCart: [],
});
const GuestModel = new mongoose.model("GuestCart", GuestCartSchema);

const UserCartSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    loginStatus: {
        type: String,
        required: true,
    },
    shoppingCart: [],
    reviews: {},
});
const UserModel = new mongoose.model("UserCart", UserCartSchema);

const ProductSchema = new mongoose.Schema({
    details: {
        id: Number,
        name: String,
        manufacturerOrBrand: String,
        typeOfClothing: String,
        colorOptions: Array,
        amountInStockPerColor: {},
        weight: {
            grams: Number,
        },
        price: Number,
        materials: { polyester: String, cotton: String },
        imageName: String,
    },
    userSelectedParameters: {},
    amount: Number,
});

const ProductModel = new mongoose.model("Products", ProductSchema);

async function getAllGuests() {
    const everyone = await GuestModel.find({});
    return everyone;
}

async function getAllProducts() {
    const products = await ProductModel.find();
    return products;
}

async function searchAndReturnProducts(query) {
    const queryExpression = new RegExp(query, "i");
    const products = await ProductModel.find({
        "details.name": { $regex: queryExpression },
    });
    return products;
}

async function createDummyDB() {
    await ProductModel.insertMany(dummyProducts);
}

async function createAndReturnGuest(payload) {
    // validation is done before calling this function
    const { sessionToken } = payload;
    const person = new GuestModel({ sessionToken, loginStatus: "guest" });
    await person.save();
    return person;
}

async function createAndReturnUser(payload) {
    // validation is done before calling this function
    const { username, password } = payload;
    const person = new UserModel({ username, password, loginStatus: "user" });
    await person.save();
    return person;
}

async function changePassword(payload) {
    // validation is done before calling this function
    const { username, password } = payload;
    const person = await getUser({ username });
    person.password = password;
    await person.save();
    return person;
}

async function getUser(sessionToken) {
    let person = null;
    if (typeof sessionToken !== "string") {
        const { username } = sessionToken;
        person = await UserModel.findOne({ username });
    } else {
        person = await GuestModel.findOne({ sessionToken });
    }
    return person;
}

async function deleteUser(username) {
    if (typeof username !== "string") return null;

    const result = await UserModel.deleteOne({ username });
    return result.deletedCount === 1;
}

async function getAllUsers() {
    const everyone = await UserModel.find({});
    return everyone;
}

async function addToCart(newProduct, sessionToken) {
    const user = await getUser(sessionToken);
    if (!user) {
        return null;
    }
    let tempArr = user.shoppingCart;

    const indexOfIdenticalMatch = tempArr.findIndex((item) => {
        if (item.itemId === newProduct.itemId)
            if (areIdentical(item.params, newProduct.params)) {
                return item;
            }
    });
    if (indexOfIdenticalMatch === -1) {
        tempArr.push(newProduct);
        user.shoppingCart = tempArr;
    } else {
        tempArr[indexOfIdenticalMatch].amount += newProduct.amount;
        user.shoppingCart[indexOfIdenticalMatch] =
            tempArr[indexOfIdenticalMatch];
    }
    await user.save();
    return user;
}

async function deleteCartItem(indexToDelete, sessionToken) {
    let user = await getUser(sessionToken);
    if (!user) {
        return null;
    }
    if (indexToDelete < 0 || indexToDelete >= user.shoppingCart.length) {
        return user.shoppingCart;
    }
    user.shoppingCart.splice(indexToDelete, 1);
    await user.save();
    return user;
}

function areIdentical(oldData, newData) {
    let categories = Object.keys(oldData);
    let allMatch = true;
    for (const key of categories) {
        if (newData[key] !== oldData[key]) {
            allMatch = false;
        }
    }
    return allMatch;
}

async function editCartItem(dataObject, sessionToken) {
    let user = await getUser(sessionToken);
    if (!user) {
        return null;
    }
    const { indexInCart, newAmount } = dataObject;
    if (indexInCart < 0 || indexInCart >= user.shoppingCart.length) {
        return user.shoppingCart;
    }
    let tempArr = user.shoppingCart[indexInCart];
    tempArr.amount = newAmount;
    user.shoppingCart[indexInCart] = tempArr;
    await user.save();
    return user;
}
/*
async function editCartItem (dataObject, sessionToken) {
    let user = await getUser(sessionToken)
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
*/
async function deleteGuest(sessionToken) {
    if (sessionToken === null) return null;

    const result = await GuestModel.deleteOne({ sessionToken });
    return result.deletedCount === 1;
}

module.exports = {
    getUser,
    createAndReturnGuest,
    createAndReturnUser,
    getAllUsers,
    getAllGuests,
    changePassword,
    deleteUser,
    deleteGuest,
    addToCart,
    deleteCartItem,
    editCartItem,
    connectToDatabase,
    getAllProducts,
    searchAndReturnProducts,
    createDummyDB,
};
