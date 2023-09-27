const request = require("supertest");
const makeApp = require("../makeApp");
const { connect, disconnect } = require("../databaseLogic/mongoMemory");
const dbObject = require("../databaseLogic/mongoDbCarts");
const app = makeApp(dbObject, {});

const endpoint = "/api/suggestions";

beforeAll(connect);
afterAll(disconnect);

describe("POST /api/suggestions", () => {
    describe("Unhappy Path", () => {
        test("expect no data status 400", async () => {
            const api = request(app);
            const response = await api.post(endpoint);

            expect(response.statusCode).toEqual(400);
        });
        test("expect 0char status 400", async () => {
            const api = request(app);
            const payload = getParams();

            const response = await api.post(endpoint).send(payload);

            expect(response.statusCode).toEqual(400);
        });
        test("expect >50char status 400", async () => {
            const api = request(app);
            const fiftyOneCharPayload = getParams(
                "123456789123456789123456789123456789123456789123456"
            );

            const response = await api.post(endpoint).send(fiftyOneCharPayload);

            expect(response.statusCode).toEqual(400);
        });
    });

    describe("Happy Path", () => {
        test('expect "shirt" status 200, return value matches fixtures', async () => {
            const api = request(app);
            const payload = getParams("shirt");
            console.log(payload);

            const response = await api.post(endpoint).send(payload);

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual([
                "Some T Shirt",
                "Specific T Shirt",
                "Generic T Shirt",
            ]);
        });
        test('expect "specific" status 200, return value matches fixtures', async () => {
            const api = request(app);
            const payload = getParams("specific");

            const response = await api.post(endpoint).send(payload);

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual(["Specific T Shirt"]);
        });
    });

    function getParams(term) {
        const params = {
            searchTerm: term ?? "",
        };

        return params;
    }
});

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
