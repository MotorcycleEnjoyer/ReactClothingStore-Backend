const dummyProductDB = [{
id: 1,
name: "one",
manufacturerOrBrand: "T-Shirt-CO",
size: 5,
ageCategory: "5-10",
sexCategory: "M",
typeOfClothing: "T-Shirt",
colorOptions: ["red", "green", "orange", "pink"],
imagePreviewURL: "a",
variationIsInStock: [{color: "red", amountInStock: 10}, {color: "green", amountInStock: 3}, {color: "orange", amountInStock: 0}, {color:"pink", amountInStock:2}],
weight: {grams: 50},
dimensions: "LxWxH",
price: 5.99,
materials: {polyester: "50%", cotton: "50%"},
amount: 1,
totalCost: 5.99,
},
{
    id: 2,
    name: "two",
    manufacturerOrBrand: "T-Shirt-CO",
    size: 5,
    ageCategory: "10-15",
    sexCategory: "F",
    typeOfClothing: "T-Shirt",
    colorOptions: ["red", "green", "orange", "pink"],
    imagePreviewURL: "a",
    variationIsInStock: [{color: "red", amountInStock: 2}, {color: "green", amountInStock: 3}, {color: "orange", amountInStock: 4}, {color:"pink", amountInStock: 5}],
    weight: {grams: 49},
    dimensions: "LxWxH",
    price: 5.99,
    materials: {polyester: "50%", cotton: "50%"},
    amount: 1,
    totalCost: 5.99,
    }
]

const dummyProduct = {
    id: 1,
    name: "one",
    manufacturerOrBrand: "T-Shirt-CO",
    size: 5,
    ageCategory: "5-10",
    sexCategory: "M",
    typeOfClothing: "T-Shirt",
    colorOptions: ["red", "green", "orange", "pink"],
    imagePreviewURL: "a",
    variationIsInStock: [{color: "red", amountInStock: 10}, {color: "green", amountInStock: 3}, {color: "orange", amountInStock: 0}, {color:"pink", amountInStock:2}],
    weight: {grams: 50},
    dimensions: "LxWxH",
    price: 5.99,
    materials: {polyester: "50%", cotton: "50%"},
    amount: 1,
    totalCost: 5.99,
    }

const dummyProduct2 = {
    id: 2,
    name: "two",
    manufacturerOrBrand: "T-Shirt-CO",
    size: 5,
    ageCategory: "10-15",
    sexCategory: "F",
    typeOfClothing: "T-Shirt",
    colorOptions: ["red", "green", "orange", "pink"],
    imagePreviewURL: "a",
    variationIsInStock: [{color: "red", amountInStock: 2}, {color: "green", amountInStock: 3}, {color: "orange", amountInStock: 4}, {color:"pink", amountInStock: 5}],
    weight: {grams: 49},
    dimensions: "LxWxH",
    price: 5.99,
    materials: {polyester: "50%", cotton: "50%"},
    amount: 1,
    totalCost: 5.99,
    }

const cart = []

const shoppingCartDB = []

/*
let product = {
    id: ,
    name: ,
    manufacturerOrBrand: ,
    size: , // 8, 7-12, whatever
    ageCategory: , // Child, Adult
    sexCategory: , // Mens, Womens, All
    typeOfClothing: , // socks, tshirt, underwear, sweater, etc...
    colorOptions: , 
    imagePreviewURL: , // image
    amountInStock: {color1: 2, color2: 5, color3: 20},
    variationIsInStock: , // True/False
    weight: , // for shipping purposes
    dimensions: , // for shipping purposes
    price: ,
    materials: ,
    amount: ,
    totalCost: , // amount * price
}
*/

/*
let cartObject = {
    cookie: "blablabla",
    cart: [product1, product2, product3] // These are pseudocode for product objects
}
*/

// CART METHODS ASSUME, THAT THE HIGHER FUNCTION CALL WILL HAVE ACCESS TO CART OBJECT. Then it can pass either the cookie, or the cart.

function addToCart(shoppingCart, product){
    if(!product || product === undefined){
        return false
    }
    shoppingCart.push(product)
    return true
}

function removeFromCart(shoppingCart, productID){
    let index = shoppingCart.findIndex((item)=> item.id === productID)
    if(index === -1){
        console.error(`Could not find productID: ${productID}`)
        return
    }
    shoppingCart.splice(index, 1)
}

function editAmountInCart(shoppingCart, productID, newAmount){
    let index = shoppingCart.findIndex((item)=> item.id === productID)
    if(index === -1){
        console.error(`Could not find productID: ${productID}`)
        return
    }
    shoppingCart[index].amount = newAmount
}

function clearCart(shoppingCart){
    shoppingCart.splice(0)
}

/* function saveCart(shoppingCart, cookie){
    let statusOfSave = pushToDatabase(shoppingCart, cookie)
    if(statusOfSave === undefined){
        console.error("Unable to save shopping cart")
        return
    }
}

function pushToDatabase(shoppingCart, cookie){
    shoppingCart.find((item) => {
        item.coo === productID
    })
} */

module.exports = {dummyProduct, dummyProduct2, addToCart}