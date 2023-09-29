const request = require("supertest");
const makeApp = require("../makeApp");
const { cartFixtures, sessionFixtures } = require("../fixtures");
const { connect, disconnect } = require("../databaseLogic/mongoMemory");
const dbObject = require("../databaseLogic/mongoDbCarts");
const app = makeApp(dbObject);
const appWithOneActiveSession = makeApp(dbObject, sessionFixtures.oneSession);

const fixtureCookie = sessionFixtures.sessionToken;
const endpoint = "/api/login";

beforeAll(connect);
afterAll(disconnect);

async function setupDb() {
    const setupDB = await dbObject.createAndReturnUser({
        sessionToken: fixtureCookie,
    });
}
setupDb();

describe("POST /api/login", () => {
    describe("Unhappy Paths", () => {
        test("No credentials returns 400", async () => {
            const api = request(appWithOneActiveSession);
            const payload = getParams({
                username: undefined,
                password: undefined,
            });

            const response = await api
                .post(endpoint)
                .set("Cookie", `session=${fixtureCookie}`)
                .send(payload);

            expect(response.statusCode).toEqual(400);
        });
        test("Invalid Username returns 400", async () => {
            const api = request(appWithOneActiveSession);
            const payloads = [];
            payloads.push(
                getParams({
                    password: undefined,
                })
            );
            payloads.push(
                getParams({
                    password: "",
                })
            );
            payloads.push(
                getParams({
                    password: "12345",
                })
            );
            payloads.push(
                getParams({
                    password:
                        "123456789012345678901234567890123456789012345678901",
                })
            );

            payloads.forEach(async (payload) => {
                const response = await api
                    .post(endpoint)
                    .set("Cookie", `session=${fixtureCookie}`)
                    .send(payload);

                expect(response.statusCode).toEqual(400);
            });
        });
        test("Invalid Password returns 400", async () => {
            const api = request(appWithOneActiveSession);
            const payloads = [];
            payloads.push(
                getParams({
                    username: undefined,
                })
            );
            payloads.push(
                getParams({
                    username: "",
                })
            );
            payloads.push(
                getParams({
                    username: "12345",
                })
            );
            payloads.push(
                getParams({
                    username:
                        "123456789012345678901234567890123456789012345678901",
                })
            );

            payloads.forEach(async (payload) => {
                const response = await api
                    .post(endpoint)
                    .set("Cookie", `session=${fixtureCookie}`)
                    .send(payload);

                expect(response.statusCode).toEqual(400);
            });
        });
    });
    function getParams(overrides = {}) {
        const defaultParams = {
            username: "abcdefg",
            password: "abcdefg",
        };

        const params = { ...defaultParams, ...overrides };

        return params;
    }
});

describe("POST /api/login", () => {
    test("expect correct credentials to work", async () => {
        const api = request(appWithOneActiveSession);
        const payload = getParams();

        const response = await api
            .post(endpoint)
            .send(payload)
            .set("Cookie", `session=${fixtureCookie}`);

        expect(response.body).toStrictEqual(cartFixtures.itemOneCart);
    });

    function getParams(overrides = {}) {
        const defaultParams = {
            username: "abcdefg",
            password: "abcdefg",
        };

        const params = { ...defaultParams, ...overrides };

        return params;
    }
});
//     });

//     test("Adding duplicate item increments it in cart", async () => {
//         const api = request(appWithOneActiveSession);
//         const payload = getParams();

//         const response = await api
//             .post(endpoint)
//             .send(payload)
//             .set("Cookie", fixtureCookie);

//         expect(response.body).toStrictEqual(cartFixtures.duplicateItemOneCart);
//     });

//     test("Adding unique item pushes to cart", async () => {
//         const api = request(appWithOneActiveSession);
//         const payload = getParams({ itemId: 2, amount: 3 });

//         const response = await api
//             .post(endpoint)
//             .send(payload)
//             .set("Cookie", fixtureCookie);

//         expect(response.body).toStrictEqual(cartFixtures.itemTwoCart);
//     });

//     describe("[Bad Actions]", () => {
//         test("No cookie, returns new cart with that item and a cookie", async () => {
//             const api = request(appWithOneActiveSession);
//             const payload = getParams();

//             const response = await api.post(endpoint).send(payload);
//             const responseCookie = response.headers["set-cookie"][0];
//             const cookie = responseCookie.split("=")[0];

//             expect(response.body).toStrictEqual(cartFixtures.itemOneCart);
//             expect(cookie).toBeDefined();
//         });
//         test("Session not found, returns new cart with that item and a cookie", async () => {
//             const api = request(appWithOneActiveSession);
//             const payload = getParams();
//             const sentCookie = "abcdefghijklmnop";

//             const response = await api
//                 .post(endpoint)
//                 .send(payload)
//                 .set("Cookie", sentCookie);
//             const responseCookie = response.headers["set-cookie"][0];
//             const cookie = responseCookie.split("=")[0];

//             expect(response.body).toStrictEqual(cartFixtures.itemOneCart);
//             expect(cookie).toBeDefined();
//         });
//         test("No item to add to cart, returns status code 400", async () => {
//             const api = request(appWithOneActiveSession);
//             const payload = {};

//             const response = await api
//                 .post(endpoint)
//                 .set("Cookie", fixtureCookie)
//                 .send(payload);

//             expect(response.status).toBe(400);
//         });
//         describe("(Invalid parameters, returns 400)", () => {
//             test("itemId", async () => {
//                 const api = request(appWithOneActiveSession);
//                 const payloads = [];
//                 payloads.push(getParams({ itemId: undefined }));
//                 payloads.push(getParams({ itemId: null }));
//                 payloads.push(getParams({ itemId: { stuff: 12345 } }));
//                 payloads.push(getParams({ itemId: [1, 2, 3] }));
//                 payloads.push(getParams({ itemId: "abcdef" }));
//                 payloads.push(getParams({ itemId: -1 }));
//                 payloads.push(getParams({ itemId: 10001 }));

//                 for (let i = 0; i < payloads.length; i++) {
//                     const response = await api
//                         .post(endpoint)
//                         .send(payloads[i])
//                         .set("Cookie", fixtureCookie);
//                     expect(response.status).toBe(400);
//                 }
//             });
//             test("amount", async () => {
//                 const api = request(appWithOneActiveSession);
//                 const payloads = [];
//                 payloads.push(getParams({ amount: undefined }));
//                 payloads.push(getParams({ amount: null }));
//                 payloads.push(getParams({ amount: { stuff: 12345 } }));
//                 payloads.push(getParams({ amount: [1, 2, 3] }));
//                 payloads.push(getParams({ amount: "abcdef" }));
//                 payloads.push(getParams({ amount: 101 }));
//                 payloads.push(getParams({ amount: -1 }));

//                 for (let i = 0; i < payloads.length; i++) {
//                     const response = await api
//                         .post(endpoint)
//                         .send(payloads[i])
//                         .set("Cookie", fixtureCookie);
//                     expect(response.status).toBe(400);
//                 }
//             });
//             test("params", async () => {
//                 const api = request(appWithOneActiveSession);
//                 const payloads = [];
//                 payloads.push(
//                     getParams({ params: { color: undefined, size: "medium" } })
//                 );
//                 payloads.push(
//                     getParams({ params: { color: null, size: "medium" } })
//                 );
//                 payloads.push(
//                     getParams({ params: { color: {}, size: "medium" } })
//                 );
//                 payloads.push(
//                     getParams({ params: { color: [], size: "medium" } })
//                 );
//                 payloads.push(
//                     getParams({ params: { color: 1, size: "medium" } })
//                 );
//                 payloads.push(
//                     getParams({ params: { color: "1", size: "medium" } })
//                 );

//                 payloads.push(
//                     getParams({ params: { color: "red", size: undefined } })
//                 );
//                 payloads.push(
//                     getParams({ params: { color: "red", size: null } })
//                 );
//                 payloads.push(
//                     getParams({ params: { color: "red", size: {} } })
//                 );
//                 payloads.push(
//                     getParams({ params: { color: "red", size: [] } })
//                 );
//                 payloads.push(getParams({ params: { color: "red", size: 1 } }));
//                 payloads.push(
//                     getParams({ params: { color: "red", size: "1" } })
//                 );

//                 for (let i = 0; i < payloads.length; i++) {
//                     const response = await api
//                         .post(endpoint)
//                         .send(payloads[i])
//                         .set("Cookie", fixtureCookie);
//                     expect(response.status).toBe(400);
//                 }
//             });
//         });
//         test.todo("Requests exceed 10/min, returns 429");
//     });

//     describe("[Bad Server Situations]", () => {
//         test("Item of current configuration has insufficient stock, returns 500", async () => {
//             const api = request(appWithOneActiveSession);
//             const payload = getParams({ amount: 50 });

//             const response = await api
//                 .post(endpoint)
//                 .send(payload)
//                 .set("Cookie", fixtureCookie);

//             expect(response.status).toBe(500);
//         });
//         test.todo("Cannot reach Database, add to cart fails, returns 500");
//         test.todo("Database fails to add to cart, returns 500");
//     });

// });

describe("Invalid HTTP methods to /api/suggestions should return 404", () => {
    test("expect GET to return 404", async () => {
        const api = request(app);
        const response = await api.get(endpoint);

        expect(response.statusCode).toEqual(404);
    });
    test("expect PUT to return 404", async () => {
        const api = request(app);
        const response = await api.put(endpoint);

        expect(response.statusCode).toEqual(404);
    });
    test("expect DELETE to return 404", async () => {
        const api = request(app);
        const response = await api.del(endpoint);

        expect(response.statusCode).toEqual(404);
    });
});
