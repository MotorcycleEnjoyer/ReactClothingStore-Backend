const request = require("supertest");
const makeApp = require("../makeApp");
const {
    cartFixtures,
    sessionFixtures,
    productFixtures,
} = require("../utility/fixtures");
const { connect, disconnect } = require("../databaseLogic/mongoMemory");
const dbObject = require("../databaseLogic/mongoDbCarts");
const app = makeApp(dbObject, {});

const endpoint = "/api/s?k=";

beforeAll(connect);
afterAll(disconnect);

async function setupDb() {
    const makeDB = await dbObject.createDummyDB();
}
setupDb();

describe("GET /api/s", () => {
    describe("Unhappy Path", () => {
        test("expect /s (no query string) status 400", async () => {
            const api = request(app);
            const response = await api.get("/api/s");

            expect(response.statusCode).toEqual(400);
        });
        test("expect 0char status 400", async () => {
            const api = request(app);
            const finalEndpoint = endpoint + "";

            const response = await api.get(finalEndpoint);

            expect(response.statusCode).toEqual(400);
        });
        test("expect >50char status 400", async () => {
            const api = request(app);
            const fiftyOneChar =
                "123456789123456789123456789123456789123456789123456";
            const finalEndpoint = endpoint + fiftyOneChar;

            const response = await api.get(finalEndpoint);

            expect(response.statusCode).toEqual(400);
        });
    });

    describe("Happy Path", () => {
        test("expect k=shirt status 200, return value matches fixtures", async () => {
            const api = request(app);
            const finalEndpoint = endpoint + "shirt";

            const response = await api.get(finalEndpoint);

            expect(response.statusCode).toEqual(200);

            for (let i = 0; i < response.body.length; i++) {
                const product = response.body[i];

                expect(product.details).toStrictEqual(
                    productFixtures.everything[i].details
                );
            }
        });
        test("expect k=specific status 200, return value matches fixtures", async () => {
            const api = request(app);
            const finalEndpoint = endpoint + "specific";

            const response = await api.get(finalEndpoint);

            expect(response.statusCode).toEqual(200);

            const product = response.body[0];
            expect(product.details).toStrictEqual(
                productFixtures.everything[1].details
            );
        });
    });
});
