const { connect, disconnect, cleanData } = require("../databaseLogic/mongoMemory")
const cartModel = require("../databaseLogic/mongoDbCarts.js")
const sessionToken = "0904437e-95db-4372-82ea-0310812bcf1a"

describe("Cart Model", () => {
    beforeAll(connect)
    // beforeEach(cleanData)
    afterAll(disconnect)  

    test("Expect getAllUsers to return nothing on empty table", async () => {
        const response = await cartModel.getAllUsers()

        expect(response).toEqual([])
    })

    test("Expect createAndReturnUser to return a new user", async () => {
        const payload = getParams()

        const response = await cartModel.createAndReturnUser(payload)

        expect(response).toEqual(expect.objectContaining({
            __v: expect.anything(),
            _id: expect.anything(),
            sessionToken: payload.sessionToken,
            shoppingCart: []
        }))
    })

    test("Expect adding to empty cart to push 1 item", async () => {
        const setupPayload = getParams()
        const setupResponse = await cartModel.createAndReturnUser(setupPayload)
        const newProduct = setupPayload.newProduct
    
        const response = await cartModel.addToCart(newProduct, sessionToken)
    
        expect(response.length).toBe(1)
        expect(response[0]).toEqual(expect.objectContaining({
            itemId: newProduct.itemId,
            amount: newProduct.amount,
            params: expect.objectContaining({
                color: "gray",
                size: "medium"
            })
        }))
    
    })
    
    test("Expect adding duplicate item to increment existing in cart", async () => {
        const {newProduct, sessionToken} = getParams()
    
        await cartModel.addToCart(newProduct, sessionToken)
        const finalState = (await cartModel.getUser(sessionToken)).shoppingCart
        
        expect(finalState.length).toBe(1)
        expect(finalState[0]).toEqual(expect.objectContaining({
            itemId: newProduct.itemId,
            amount: (1 + newProduct.amount),
            params: expect.objectContaining({
                color: "gray",
                size: "medium"
            })
        }))
    })

    test("Expect adding separate item to push one more thing to cart", async () => {
        const {newProduct, sessionToken} = getParams()
        newProduct.itemId = 2
        
        await cartModel.addToCart(newProduct, sessionToken)
    
        const finalState = (await cartModel.getUser(sessionToken)).shoppingCart
        
        expect(finalState.length).toBe(2)
        expect(finalState[1]).toEqual(expect.objectContaining({
            itemId: newProduct.itemId,
            amount: newProduct.amount,
            params: expect.objectContaining({
                color: "gray",
                size: "medium"
            })
        }))
    })
    
    function getParams(override = {}) {
        const defaultParams = {
            sessionToken: "0904437e-95db-4372-82ea-0310812bcf1a",
            newProduct: {
                itemId: 1,
                amount: 1,
                params: {
                    color: "gray",
                    size: "medium",
                }
            }
        }
        
        const params = {...defaultParams, ...override}
        
        return params
    }
})