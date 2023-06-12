const cartFixtures = {
    intitialCart: {
        loginStatus: "anon",
        shoppingCart: []
    },
    itemOneCart: {
        loginStatus: "anon",
        shoppingCart: [{
            itemId: 1,
            amount: 1
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
    }
}

module.exports = { cartFixtures, sessionFixtures }