const db = [
        {
            id: 1,
            name: "Generic T Shirt",
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
            color: "NONE"
        },
        {
            id: 2,
            name: "Not Generic T Shirt",
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
            color: "NONE"
            }
        ]

module.exports = {db}