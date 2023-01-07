const dummyProductDB = [ {}, {}]

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
        return
    }
    shoppingCart.push(product)
}

function removeFromCart(shoppingCart, productID){
    shoppingCart.splice(
        shoppingCart.findIndex((item)=>{
        item.id === productID
        })
    , 1)
}

function editAmountInCart(shoppingCart, productID, newAmount){
    shoppingCart.find((item) => {
        item.id === productID
    }).amount = newAmount
}

function clearCart(shoppingCart){
    shoppingCart = []
}

function saveCart(shoppingCart, cookie){
    let statusOfSave = pushToDatabase(shoppingCart, cookie)
    if(statusOfSave === undefined){
        console.error("Unable to save shopping cart")
        return
    }
}
