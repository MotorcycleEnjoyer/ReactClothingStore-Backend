const db = [
    {
        details: {
            id: 1,
            name: "Generic T Shirt",
            manufacturerOrBrand: "T-Shirt-CO",
            typeOfClothing: "T-Shirt",
            colorOptions: ["red", "green", "orange", "pink"],
            amountInStockPerColor: {
                    red: 10, 
                    green: 3,
                    orange: 0, 
                    pink: 2
            },
            weight: {grams: 50},
            price: 5.99,
            materials: {polyester: "50%", cotton: "50%"},
        },
        userSelectedParameters: {},
        amount: 0
    },
]

module.exports = {db}