const request = require("supertest")
const makeApp = require("../makeApp")
const { cartFixtures, sessionFixtures } = require("../fixtures")
const app = makeApp()
const appWithOneActiveSession = makeApp({}, sessionFixtures.oneSession)
const appWithOneItemInCart = makeApp({}, sessionFixtures.sessionWithOneItem)
const manyItemApp = makeApp({}, sessionFixtures.sessionWithManyItems)

const fixtureCookie = sessionFixtures.sessionToken
const endpoint = "/api/shoppingCart"

describe("GET /api/shoppingCart", () => {
        test("Returns object with shopping cart and user login status", async () => {
            const api = request(app)
    
            const response = await api.get(endpoint)
            
            expect(response.body).toEqual(expect.objectContaining({
                loginStatus: expect.any(String),
                shoppingCart: expect.any(Array)
            }))
        })
        test("Returns a cookie if none in request", async () => {
            const api = request(app)
            
            const response = await api.get(endpoint)
            const cookie = response.headers["set-cookie"]
    
            expect(cookie).toBeDefined()
        })
        test("Returns a cookie if session not found on server", async () => {
            const api = request(app)
            const sentCookie = "abcdefghijklmnop"
    
            const response = await api.get(endpoint).set("Cookie", sentCookie)
            const cookie = response.headers["set-cookie"]
    
            expect(cookie).toBeDefined()
        })
        test("Does NOT return a cookie if session is found on server", async () => {
            const api = request(app)
            const response = await api.get(endpoint)
            const cookieHeader = response.headers["set-cookie"][0]
            const validCookie = cookieHeader.split("=")[0]
    
            const testResponse = await api.get(endpoint).set("Cookie", validCookie)
            const testCookie = testResponse.headers["set-cookie"]
            
            expect(testCookie).toBe(undefined)
        })
        test("Does NOT return a cookie if session is found on server, fixture version", async () => {
            const api = request(appWithOneActiveSession)
            
            const response = await api.get(endpoint).set("Cookie", fixtureCookie)
            const testCookie = response.headers["set-cookie"]
    
            expect(testCookie).toBe(undefined)
        })
        test.todo("Requests exceed 10/min, returns 429")
})

describe("POST /api/shoppingCart", () => {

    test("Returns cart with item added", async () => {
        const api = request(appWithOneActiveSession)
        const payload = getParams()

        const response = await api.post(endpoint).send(payload).set("Cookie", fixtureCookie)

        expect(response.body).toStrictEqual(cartFixtures.itemOneCart)
    })

    test("Adding duplicate item increments it in cart", async () => {
        const api = request(appWithOneItemInCart)
        const payload = getParams()
        
        const response = await api.post(endpoint).send(payload).set("Cookie", fixtureCookie)

        expect(response.body).toStrictEqual(cartFixtures.duplicateItemOneCart)
    })
    
    describe("[Bad Actions]", () => {
        test("No cookie, returns new cart with that item and a cookie", async () => {
            const api = request(app)
            const payload = getParams()
    
            const response = await api.post(endpoint).send(payload)
            const responseCookie = response.headers["set-cookie"][0]
            const cookie = responseCookie.split("=")[0]
    
            expect(response.body).toStrictEqual(cartFixtures.itemOneCart)
            expect(cookie).toBeDefined()
        })
        test("Session not found, returns new cart with that item and a cookie", async () => {
            const api = request(app)
            const payload = getParams()
    
            const response = await api.post(endpoint).send(payload).set("Cookie", fixtureCookie)
            const responseCookie = response.headers["set-cookie"][0]
            const cookie = responseCookie.split("=")[0]
            
            expect(response.body).toStrictEqual(cartFixtures.itemOneCart)
            expect(cookie).toBeDefined()
        })
        test("No item to add to cart, returns status code 400", async () => {
            const api = request(appWithOneActiveSession)
            const payload = {}
    
            const response = await api.post(endpoint).set("Cookie", fixtureCookie).send(payload)
    
            expect(response.status).toBe(400)
        })
        describe("(Invalid parameters, returns 400)", () => {
            test("itemId", async () => {
                const api = request(appWithOneActiveSession)
                const payloads = []
                payloads.push( getParams({ itemId: undefined }))
                payloads.push( getParams({ itemId: null }))
                payloads.push( getParams({ itemId: { stuff: 12345 } }))
                payloads.push( getParams({ itemId: [1, 2, 3] }))
                payloads.push( getParams({ itemId: "abcdef" }))
    
                for (let i = 0; i < payloads.length; i++) {
                    const response = await api.post(endpoint).send(payloads[i]).set("Cookie", fixtureCookie)
                    expect(response.status).toBe(400)
                }                 
            })
            test("amount", async () => {
                const api = request(appWithOneActiveSession)
                const payloads = []
                payloads.push( getParams({ amount: undefined }) )
                payloads.push( getParams({ amount: null }) )
                payloads.push( getParams({ amount: { stuff: 12345 } }) )
                payloads.push( getParams({ amount: [1, 2, 3] }) )
                payloads.push( getParams({ amount: "abcdef" }) )
                payloads.push( getParams({ amount: 101 }) )
                payloads.push( getParams({ amount: -1 }) )
    
                for (let i = 0; i < payloads.length; i++) {
                    const response = await api.post(endpoint).send(payloads[i]).set("Cookie", fixtureCookie)
                    expect(response.status).toBe(400)
                }
            })
            test("params", async () => {
                const api = request(appWithOneActiveSession)
                const payloads = []
                payloads.push( getParams({ params: { color: undefined, size: "medium" }}) )
                payloads.push( getParams({ params: { color: null, size: "medium" }}) )
                payloads.push( getParams({ params: { color: {}, size: "medium" }}) )
                payloads.push( getParams({ params: { color: [], size: "medium" }}) )
                payloads.push( getParams({ params: { color: 1, size: "medium" }}) )
                payloads.push( getParams({ params: { color: "1", size: "medium" }}) )
    
                payloads.push( getParams({ params: { color: "red", size: undefined }}) )
                payloads.push( getParams({ params: { color: "red", size: null }}) )
                payloads.push( getParams({ params: { color: "red", size: {} }}) )
                payloads.push( getParams({ params: { color: "red", size: [] }}) )
                payloads.push( getParams({ params: { color: "red", size: 1 }}) )
                payloads.push( getParams({ params: { color: "red", size: "1" }}) )
    
                for (let i = 0; i < payloads.length; i++) {
                    const response = await api.post(endpoint).send(payloads[i]).set("Cookie", fixtureCookie)
                    expect(response.status).toBe(400)
                }
    
            })
        })
        test.todo("Requests exceed 10/min, returns 429")
    })
    
    describe("[Bad Server Situations]", () => {
        test("Item of current configuration has insufficient stock, returns 500", async () => {
            const api = request(appWithOneActiveSession)
            const payload = getParams({ amount: 50 })

            const response = await api.post(endpoint).send(payload).set("Cookie", fixtureCookie)

            expect(response.status).toBe(500)
        })
        test.todo("Cannot reach Database, add to cart fails, returns 500")
        test.todo("Database fails to add to cart, returns 500")
    })
    
    
    function getParams (overrides = {}) {
        const defaultParams = {
            itemId: 1,
            amount: 1,
            params: {
                color: "gray",
                size: "medium",
            }
        }
    
        const params = { ...defaultParams, ...overrides }
    
        return params
    }
})


describe("PUT /api/shoppingCart", () => {
    // This is editing cart item
    test("Returns shopping cart with amount updated on item, if in stock", async () => {
        const api = request(appWithOneItemInCart)
        const payload = getParams()

        const response = await api.put(endpoint).send(payload).set("Cookie", fixtureCookie)
        const shoppingCartItem = response.body.shoppingCart[0]

        expect(shoppingCartItem.amount).toBe(10)
    })

    describe("[Bad actions]", () => {
        test("No cookie, returns status code 400", async () => {
            const api = request(appWithOneItemInCart)
            const payload = getParams()

            const response = await api.put(endpoint).send(payload)

            expect(response.status).toBe(400)
        })
        describe("(Invalid parameters, returns status code 400)", () => {
            test("indexInCart", async () => {
                const api = request(appWithOneActiveSession)
                const payloads = []
                payloads.push( getParams({ indexInCart: undefined }) )
                payloads.push( getParams({ indexInCart: null }) )
                payloads.push( getParams({ indexInCart: { stuff: 12345 } }) )
                payloads.push( getParams({ indexInCart: [1, 2, 3] }) )
                payloads.push( getParams({ indexInCart: "abcdef" }) )
                payloads.push( getParams({ indexInCart: 101 }) )
                payloads.push( getParams({ indexInCart: -1 }) )

                for(let i = 0; i < payloads.length; i++) {
                    const response = await api.put(endpoint).send(payloads[i]).set("Cookie", fixtureCookie)
                    expect(response.status).toBe(400)
                }
            })
            test("newAmount", async () => {
                const api = request(appWithOneActiveSession)
                const payloads = []
                payloads.push( getParams({ newAmount: undefined }) )
                payloads.push( getParams({ newAmount: null }) )
                payloads.push( getParams({ newAmount: { stuff: 12345 } }) )
                payloads.push( getParams({ newAmount: [1, 2, 3] }) )
                payloads.push( getParams({ newAmount: "abcdef" }) )
                payloads.push( getParams({ newAmount: 101 }) )
                payloads.push( getParams({ newAmount: -1 }) )

                for(let i = 0; i < payloads.length; i++) {
                    const response = await api.put(endpoint).send(payloads[i]).set("Cookie", fixtureCookie)
                    expect(response.status).toBe(400)
                }
            })
        })
    })

    describe("[Bad Server Situations]", () => {
        test("Item of edit configuration is out of stock, returns 500", async () => {
            const api = request(appWithOneItemInCart)
            const payload = getParams( { newAmount: 16 })

            const response = await api.put(endpoint).send(payload).set("Cookie", fixtureCookie)

            expect(response.status).toBe(500)
        })
        test.todo("Cannot reach database, edit cart fails, returns 500")
        test.todo("Database fails to edit item, returns 500")
    })

    function getParams (overrides = {}) {
        const defaultParams = {
            indexInCart: 0,
            newAmount: 10
        }
    
        const params = { ...defaultParams, ...overrides }
    
        return params
    }
})

describe("DELETE /api/shoppingCart", () => {
    // This is deleting cart item or whole cart
    test("Deletes item at index and returns 200", async () => {
        const api = request(manyItemApp)
        const payload = getParams({ indexInCart: 1 })

        const response = await api.delete(endpoint).send(payload).set("Cookie", fixtureCookie)

        expect(response.status).toBe(200)
    })

    describe("[Bad Actions]", () => {
        test("No cookie, returns 400", async () => {
            const api = request(manyItemApp)
            const payload = getParams()

            const response = await api.delete(endpoint).send(payload)

            expect(response.status).toBe(400)
        })
        test("Invalid index to delete, returns 400", async () => {
            const api = request(manyItemApp)
            const payload = getParams({ indexInCart: null })
            const payloads = []
            payloads.push( getParams({ indexInCart: undefined }) )
            payloads.push( getParams({ indexInCart: null }) )
            payloads.push( getParams({ indexInCart: { stuff: 12345 } }) )
            payloads.push( getParams({ indexInCart: [1, 2, 3] }) )
            payloads.push( getParams({ indexInCart: "abcdef" }) )
            payloads.push( getParams({ indexInCart: 101 }) )
            payloads.push( getParams({ indexInCart: -1 }) )

            for (let i = 0; i < payloads.length; i++) {
                const response = await api.delete(endpoint).send(payload).set("Cookie", fixtureCookie)

                expect(response.status).toBe(400)
            }
        })
    })

    describe("[Bad Server Situations]", () => {
        test.todo("Index does not exist, returns 500")
        test.todo("Cannot reach database, delete cart item fails, returns 500")
        test.todo("Database fails to delete item, returns 500")
    })

    function getParams (overrides = {}) {
        const defaultParams = {
            indexInCart: 0,
        }
    
        const params = { ...defaultParams, ...overrides }
    
        return params
    }
})