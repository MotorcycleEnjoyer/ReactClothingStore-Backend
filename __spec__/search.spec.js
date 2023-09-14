const request = require("supertest");
const makeApp = require("../makeApp");
const { cartFixtures, sessionFixtures } = require("../fixtures");
const { connect, disconnect } = require("../databaseLogic/mongoMemory");
const dbObject = require("../databaseLogic/mongoDbCarts");
const app = makeApp(dbObject, {});

const endpoint = "/api/s?k=";

beforeAll(connect);
afterAll(disconnect);

async function setupDb() {
    const makeDB = await dbObject.createDummyDB();
    const products = await dbObject.getAllProducts();
    console.log("*************************PRODUCTS*************************");
    console.log(products);
    console.log(
        "***************************************************************************"
    );
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
        test("expect k=shirt status 200", async () => {
            const api = request(app);
            const finalEndpoint = endpoint + "shirt";

            const response = await api.get(finalEndpoint);

            expect(response.statusCode).toEqual(200);
            // expect(response.body).toEqual([]);
        });
    });
});
