const db = [
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
                    pink: 2
            },
            weight: {grams: 50},
            price: 5.99,
            materials: {polyester: "50%", cotton: "50%"},
        },
        userSelectedParameters: {},
        amount: 0
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
                    pink: 2
            },
            weight: {grams: 50},
            price: 10.99,
            materials: {polyester: "50%", cotton: "50%"},
        },
        userSelectedParameters: {},
        amount: 0
    },
    {
        details: {
            id: 2,
            name: "Some T Shirt",
            manufacturerOrBrand: "Someone",
            typeOfClothing: "T-Shirt",
            colorOptions: ["red", "green", "orange", "pink", "cyan", "purple", "yellow", "blue", "pink"],
            amountInStockPerColor: {
                    red: 10, 
                    green: 3,
                    orange: 0, 
                    pink: 2
            },
            weight: {grams: 50},
            price: 3.99,
            materials: {polyester: "50%", cotton: "50%"},
        },
        userSelectedParameters: {},
        amount: 0
    },
    
]

const suggestions = db.map(item => item.details.name)

module.exports = {db, suggestions}