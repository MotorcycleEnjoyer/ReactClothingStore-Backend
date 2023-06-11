const request = require("supertest")
const makeApp = require("./makeApp")
const app = makeApp()
const { cartFixtures } = require("./fixtures")

describe("/", () => {
    const endpoint = "/helloWorld"
    
    describe("GET", () => {
        test("Returns Hello World!", async () => {
            const api = request(app)
            const response = await api.get(endpoint)

            expect(response.body).toBe("Hello World!")
        })

        test("Requests exceed 6/second, returns 429", async () => {
            const api = request(app)

            let response
            // 
            for (let i = 1; i <= 6; i++) {
                response = await api.get(endpoint)
                if(i === 5) {
                    expect(response.status).toBe(200)
                }
                if(i === 6) {
                    expect(response.status).toBe(429)
                }
            }
        })
    })
})

describe("/api/shoppingCart", () => {
    const endpoint = "/api/shoppingCart"

    describe("GET", () => {
        test("Returns object with shopping cart and user login status", async () => {
            const api = request(app)

            const response = await api.get(endpoint)

            expect(response.body).toStrictEqual(cartFixtures.intitialCart)
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
            const validCookie = response.headers["set-cookie"]

            const testResponse = await api.get(endpoint).set("Cookie", validCookie)
            const testCookie = testResponse.headers.cookie
            
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

    describe("POST", () => {
        // This is adding to cart
        describe("Bad Actions", () => {
            test.todo("No / invalid cookie, returns new cart w item appended")
            test.todo("No item to add to cart, returns status code 400")
            test.todo("Invalid item to add to cart, returns 400")
            test.todo("Invalid amount of item to add to cart, returns 400")
            test.todo("Invalid parameters on item (ex: color), returns 400")
            test.todo("Requests exceed 10/min, returns 429")
        })

        describe("Bad Server Situations", () => {
            test.todo("Item of current configuration is out of stock, returns 500")
            test.todo("Cannot reach Database, add to cart fails, returns 500")
            test.todo("Database fails to add to cart, returns 500")
        })

    })

    describe("PUT", () => {
        // This is editing cart item

    })

    describe("DELETE", () => {
        // This is deleting cart item or whole cart

    })
})