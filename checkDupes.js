function itemIsDuplicate (object, cart) {
    const status = cart.findIndex((x) => {
        if(x.itemId === object.itemId) {
            const keys = Object.keys(x.params)
            let allEqual = true
            for (let i = 0; i < keys.length; i++){
                if(object.params[keys[i]] !== x.params[keys[i]]) {
                    allEqual = false
                }
            }
            if (allEqual) {
                return x
            }
        }
    })

    return status
}

const cartOne = {
    userType: "anon",
    shoppingCart: [
        {
            itemId: 2,
            amount: 2,
            params: {
                color: "gray",
                size: "medium",
            }
        },
        {
            itemId: 1,
            amount: 2,
            params: {
                color: "gray",
                size: "mediums",
            }
        },
        {
            itemId: 1,
            amount: 2,
            params: {
                color: "grays",
                size: "mediums",
            }
        },
        {
            itemId: 1,
            amount: 2,
            params: {
                color: "gray",
                size: "medium",
            }
        },
    ]
}

const item = {
    itemId: 1,
    amount: 10,
    params: {
        color: "gray",
        size: "medium"
    }
}

const theStatus = itemIsDuplicate(item, cartOne.shoppingCart)

console.log(theStatus)