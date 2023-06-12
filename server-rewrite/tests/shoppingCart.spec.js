const request = require("supertest")
const makeApp = require("../makeApp")
const { cartFixtures, sessionFixtures } = require("../fixtures")
const app = makeApp()
const appWithOneActiveSession = makeApp({}, sessionFixtures.oneSession)

describe("/api/shoppingCart", () => {
    const endpoint = "/api/shoppingCart"
    const fixtureCookie = sessionFixtures.sessionToken

    describe("<<[GET]>>", () => {
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
/*         test("Requests exceed 10/min, returns 429", async () => {
            const api = request(app)

            let response
            for (let i = 0; i <= 10; i++) {
                response = await api.get(endpoint)
            }
    
            expect(response.statusCode).toBe(429)
        }) */
    })

    describe("<<[POST]>>", () => {
        // This is adding to cart

/*         test("If session exists, returns cart with item pushed", async () => {
            const api = request(sessionApp)
        }) */

        describe("[Bad Actions]", () => {
            test("No cookie, returns new cart with that item and a cookie", async () => {
                const api = request(app)
                const payload = {
                    itemId: 1
                }

                const response = await api.post(endpoint).send(payload)
                const responseCookie = response.headers["set-cookie"][0]
                const cookie = responseCookie.split("=")[0]

                expect(response.body).toStrictEqual(cartFixtures.itemOneCart)
                expect(cookie).toBeDefined()
            })
            test("Session not found, returns new cart with that item and a cookie", async () => {
                const api = request(app)
                const payload = {
                    itemId: 1
                }                

                const response = await api.post(endpoint).send(payload).set("Cookie", fixtureCookie)
                const responseCookie = response.headers["set-cookie"][0]
                const cookie = responseCookie.split("=")[0]
                
                expect(response.body).toStrictEqual(cartFixtures.itemOneCart)
                expect(cookie).toBeDefined()
            })
            test("No item to add to cart, returns status code 400", async () => {
                const api = request(appWithOneActiveSession)

                const response = await api.post(endpoint).set("Cookie", fixtureCookie)

                expect(response.status).toBe(400)
            })
            describe("(Invalid item to add to cart, returns 400)", () => {
                test("itemId is undefined", async () => {
                    const api = request(appWithOneActiveSession)
                    const payload = { itemId: undefined }
    
                    const response = await api.post(endpoint).send(payload).set("Cookie", fixtureCookie)
                    expect(response.status).toBe(400)                    
                })
                test("itemId is null", async () => {
                    const api = request(appWithOneActiveSession)
                    const payload = { itemId: null }
                    
                    const response = await api.post(endpoint).send(payload).set("Cookie", fixtureCookie)
                    expect(response.status).toBe(400)
                })
                test("itemId is an object", async () => {
                    const api = request(appWithOneActiveSession)
                    const payload = { itemId: { id: 12345 } }
    
                    const response = await api.post(endpoint).send(payload).set("Cookie", fixtureCookie)
                    expect(response.status).toBe(400)
                })
                test("itemId is an array", async () => {
                    const api = request(appWithOneActiveSession)
                    const payload = { itemId: [1, 2] }
    
                    const response = await api.post(endpoint).send(payload).set("Cookie", fixtureCookie)
                    expect(response.status).toBe(400)
                })
            })
            test.todo("Invalid amount of item to add to cart, returns 400")
            test.todo("Invalid parameters on item (ex: color), returns 400")
            test.todo("Requests exceed 10/min, returns 429")
        })

        describe("[Bad Server Situations]", () => {
            test.todo("Item of current configuration is out of stock, returns 500")
            test.todo("Cannot reach Database, add to cart fails, returns 500")
            test.todo("Database fails to add to cart, returns 500")
        })

    })

    describe("<<[PUT]>>", () => {
        // This is editing cart item
        describe("[Bad actions]", () => {
            test.todo("No cookie, returns status code 400")
            test.todo("Cookie not found in sessions, returns status code 400")
            test.todo("No item, returns status code 400")
            test.todo("Invalid item, returns status code 400")
            test.todo("Invalid amount of item in edit, returns 400")
            test.todo("Invalid parameters (ex: color) on edit, returns 400")
        })

        describe("[Bad Server Situations]", () => {
            test.todo("Item of edit configuration is out of stock, returns 500")
            test.todo("Cannot reach database, edit cart fails, returns 500")
            test.todo("Database fails to edit item, returns 500")
        })

    })

    describe("<<[DELETE]>>", () => {
        // This is deleting cart item or whole cart
        describe("[Bad Actions]", () => {
            test.todo("No cookie, returns 400")
            test.todo("Cookie not found in sessions, returns 400")
            test.todo("No index to delete, returns 400")
            test.todo("Invalid index to delete, returns 400")
        })

        describe("[Bad Server Situations]", () => {
            test.todo("Index does not exist, returns 500")
            test.todo("Cannot reach database, delete cart item fails, returns 500")
            test.todo("Database fails to delete item, returns 500")
        })
    })
})