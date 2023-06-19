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
    }
}

const sessionFixtures = {
    sessionToken: "0904437e-95db-4372-82ea-0310812bcf1a",
    oneSession: {
        "0904437e-95db-4372-82ea-0310812bcf1a": {
            loginStatus: "anon",
            shoppingCart: []
        }
    },
    sessionWithOneItem: {
        "0904437e-95db-4372-82ea-0310812bcf1a": {
            loginStatus: "anon",
            shoppingCart: [{
                itemId: 1,
                amount: 1,
                params: {
                    color: "gray",
                    size: "medium",
                }
            }]
        }
    },
    sessionWithManyItems: {
        "0904437e-95db-4372-82ea-0310812bcf1a": {
            loginStatus: "anon",
            shoppingCart: [
                {
                    itemId: 0,
                    amount: 1,
                    params: {
                        color: "gray",
                        size: "medium",
                    }
                },
                {
                    itemId: 1,
                    amount: 2,
                    params: {
                        color: "yellow",
                        size: "medium",
                    }
                },
                {
                    itemId: 2,
                    amount: 3,
                    params: {
                        color: "orange",
                        size: "medium",
                    }
                },
                {
                    itemId: 3,
                    amount: 5,
                    params: {
                        color: "pink",
                        size: "medium",
                    }
                },
            ]
        }
    }
}

module.exports = { cartFixtures, sessionFixtures }