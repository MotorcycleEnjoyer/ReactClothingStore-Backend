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