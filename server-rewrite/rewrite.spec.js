const request = require("supertest")
const makeApp = require("./makeApp")
const app = makeApp()
const { cartFixtures } = require("./fixtures")

describe("/", () => {
    const api = request(app)
    const endpoint = "/"

    describe("GET", () => {
        test("Returns Hello World!", async () => {
            const response = await api.get(endpoint)

            expect(response.body).toBe("Hello World!")
        })
    })
})

describe("/api/shoppingCart", () => {
    const api = request(app)
    const endpoint = "/api/shoppingCart"

    describe("GET", () => {
        test("Returns object with shopping cart and user login status", async () => {
            const response = await api.get(endpoint)

            expect(response.body).toStrictEqual(cartFixtures.intitialCart)
        })
        test("Returns a cookie if none in request", async () => {
            const response = await api.get(endpoint)

            const cookie = response.headers["set-cookie"]

            expect(cookie).toBeDefined()
        })
        test("Returns a cookie if session not found on server", async () => {
            const sentCookie = "abcdefghijklmnop"
            const response = await api.get(endpoint).set("Cookie", sentCookie)
            const cookie = response.headers["set-cookie"]

            expect(cookie).toBeDefined()
        })
        test("Does NOT return a cookie if session is found on server", async () => {
            const response = await api.get(endpoint)
            const validCookie = response.headers["set-cookie"]

            const testResponse = await api.get(endpoint).set("Cookie", validCookie)
            const testCookie = testResponse.headers.cookie
            
            expect(testCookie).toBe(undefined)
        })
    })

    describe("POST", () => {
        // This is adding to cart

    })

    describe("PUT", () => {
        // This is editing cart item

    })

    describe("DELETE", () => {
        // This is deleting cart item or whole cart

    })
})