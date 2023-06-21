const cartFixtures = {
    intitialCart: {
        loginStatus: "anon",
        shoppingCart: []
    },
    itemOneCart: {
        loginStatus: "anon",
        shoppingCart: [{
            itemId: 1,
            amount: 1,
            params: {
                color: "gray",
                size: "medium",
            }
        }]
    },
    duplicateItemOneCart: {
        loginStatus: "anon",
        shoppingCart: [{
            itemId: 1,
            amount: 2,
            params: {
                color: "gray",
                size: "medium",
            }
        }]
    },
    itemTwoCart: {
        loginStatus: "anon",
        shoppingCart: [{
            itemId: 1,
            amount: 2,
            params: {
                color: "gray",
                size: "medium",
            }
        },
        {
            itemId: 2,
            amount: 3,
            params: {
                color: "gray",
                size: "medium",
            }
        }
    ]
    },
    finalCart: {
        loginStatus: "anon",
        shoppingCart: [{
            itemId: 1,
            amount: 10,
            params: {
                color: "gray",
                size: "medium",
            }
        }]
    }
}

const sessionFixtures = {
    sessionToken: "0904437e-95db-4372-82ea-0310812bcf1a",
    oneSession: {
        "0904437e-95db-4372-82ea-0310812bcf1a": {type: "anon"}
    }
}

module.exports = { cartFixtures, sessionFixtures }