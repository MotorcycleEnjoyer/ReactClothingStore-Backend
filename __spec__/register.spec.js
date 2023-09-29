const request = require("supertest");
const makeApp = require("../makeApp");
const { cartFixtures, sessionFixtures } = require("../fixtures");
const { connect, disconnect } = require("../databaseLogic/mongoMemory");
const dbObject = require("../databaseLogic/mongoDbCarts");
const app = makeApp(dbObject);
const appWithOneActiveSession = makeApp(dbObject, sessionFixtures.oneSession);

const fixtureCookie = sessionFixtures.sessionToken;
const endpoint = "/api/register";

beforeAll(connect);
afterAll(disconnect);

async function setupDb() {
    const setupUser = await dbObject.createAndReturnUser({
        username: "abcdefg",
        password: "abcdefg",
    });
    const setupGuest = await dbObject.createAndReturnGuest({
        sessionToken: fixtureCookie,
    });
}
setupDb();

describe("POST /api/register", () => {
    describe("Unhappy Paths", () => {
        test("No credentials, status 400", async () => {
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
        test("Invalid Username, status 400", async () => {
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
        test("Invalid Password, status 400", async () => {
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
        test("Username is taken, status 409", async () => {
            const api = request(appWithOneActiveSession);
            const payload = getParams({
                username: "abcdefg",
            });

            const response = await api
                .post(endpoint)
                .set("Cookie", `session=${fixtureCookie}`)
                .send(payload);

            expect(response.statusCode).toEqual(409);
        });
    });
    describe("Happy Paths", () => {
        test("valid unused credentials, returns CSRF token & Status 200", async () => {
            const api = request(appWithOneActiveSession);
            const payload = getParams();

            const response = await api
                .post(endpoint)
                .send(payload)
                .set("Cookie", `session=${fixtureCookie}`);

            expect(response.statusCode).toEqual(200);
        });
    });
    function getParams(overrides = {}) {
        const defaultParams = {
            username: "1234567",
            password: "abcdefg",
            confirmPassword: "abcdefg",
        };

        const params = { ...defaultParams, ...overrides };

        return params;
    }
});

describe("Invalid HTTP methods to /api/register should return 404", () => {
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
