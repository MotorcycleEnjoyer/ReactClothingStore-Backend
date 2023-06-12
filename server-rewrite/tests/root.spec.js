const request = require("supertest")
const makeApp = require("../makeApp")
const app = makeApp()

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

