const cartFixtures = {
    intitialCart: {
        loginStatus: "anon",
        shoppingCart: [],
    },
    itemOneCart: {
        loginStatus: "anon",
        shoppingCart: [
            {
                itemId: 1,
                amount: 1,
                params: {
                    color: "gray",
                    size: "medium",
                },
            },
        ],
    },
    duplicateItemOneCart: {
        loginStatus: "anon",
        shoppingCart: [
            {
                itemId: 1,
                amount: 2,
                params: {
                    color: "gray",
                    size: "medium",
                },
            },
        ],
    },
    itemTwoCart: {
        loginStatus: "anon",
        shoppingCart: [
            {
                itemId: 1,
                amount: 2,
                params: {
                    color: "gray",
                    size: "medium",
                },
            },
            {
                itemId: 2,
                amount: 3,
                params: {
                    color: "gray",
                    size: "medium",
                },
            },
        ],
    },
    finalCart: {
        loginStatus: "anon",
        shoppingCart: [
            {
                itemId: 1,
                amount: 10,
                params: {
                    color: "gray",
                    size: "medium",
                },
            },
        ],
    },
};

const sessionFixtures = {
    sessionToken: "0904437e-95db-4372-82ea-0310812bcf1a",
    oneSession: {
        "0904437e-95db-4372-82ea-0310812bcf1a": { type: "anon" },
    },
};

const productFixtures = {
    everything: [
        {
            details: {
                id: 0,
                name: "Generic T Shirt",
                manufacturerOrBrand: "T-Shirt-CO",
                typeOfClothing: "T-Shirt",
                colorOptions: ["red", "green", "orange", "pink"],
                amountInStockPerColor: {
                    red: 10,
                    green: 3,
                    orange: 0,
                    pink: 2,
                },
                weight: { grams: 50 },
                price: 5.99,
                materials: { polyester: "50%", cotton: "50%" },
                imageName: "t-shirt-preview.png",
            },
            userSelectedParameters: {},
            amount: 0,
        },
        {
            details: {
                id: 1,
                name: "Specific T Shirt",
                manufacturerOrBrand: "Someone",
                typeOfClothing: "T-Shirt",
                colorOptions: ["red", "pink"],
                amountInStockPerColor: {
                    red: 10,
                    pink: 2,
                },
                weight: { grams: 50 },
                price: 10.99,
                materials: { polyester: "50%", cotton: "50%" },
                imageName: "t-shirt-preview.png",
            },
            userSelectedParameters: {},
            amount: 0,
        },
        {
            details: {
                id: 2,
                name: "Some T Shirt",
                manufacturerOrBrand: "Someone",
                typeOfClothing: "T-Shirt",
                colorOptions: [
                    "red",
                    "green",
                    "orange",
                    "pink",
                    "cyan",
                    "purple",
                    "yellow",
                    "blue",
                ],
                amountInStockPerColor: {
                    red: 10,
                    green: 3,
                    orange: 0,
                    pink: 2,
                },
                weight: { grams: 50 },
                price: 3.99,
                materials: { polyester: "50%", cotton: "50%" },
                imageName: "t-shirt-preview.png",
            },
            userSelectedParameters: {},
            amount: 0,
        },
    ],
};
module.exports = { cartFixtures, sessionFixtures, productFixtures };
