const {
    connect,
    disconnect,
    cleanData,
} = require("../../databaseLogic/mongoMemory");
const DatabaseMethods = require("../../databaseLogic/mongoDbCarts.js");
const sessionToken = "0904437e-95db-4372-82ea-0310812bcf1a";

describe("Guest Cart Model", () => {
    beforeAll(connect);
    // beforeEach(cleanData)
    afterAll(disconnect);

    test("Expect getAllGuests to return nothing on empty table", async () => {
        const response = await DatabaseMethods.getAllGuests();

        expect(response).toEqual([]);
    });

    test("Expect createAndReturnGuest to return a new Guest", async () => {
        const payload = getParams();

        const response = await DatabaseMethods.createAndReturnGuest(payload);

        expect(response).toEqual(
            expect.objectContaining({
                __v: expect.anything(),
                _id: expect.anything(),
                sessionToken: payload.sessionToken,
                shoppingCart: [],
            })
        );
    });

    test("Expect getUser to return an existing Guest, given existing session token", async () => {
        const payload = getParams();

        const response = await DatabaseMethods.getUser(sessionToken);

        expect(response).toEqual(
            expect.objectContaining({
                __v: expect.anything(),
                _id: expect.anything(),
                sessionToken: payload.sessionToken,
                shoppingCart: [],
            })
        );
    });

    test("Expect adding to empty cart to push 1 item", async () => {
        const setupPayload = getParams();
        const newProduct = setupPayload.newProduct;

        await DatabaseMethods.addToCart(newProduct, sessionToken);
        const { shoppingCart } = await DatabaseMethods.getUser(sessionToken);

        expect(shoppingCart.length).toBe(1);
        expect(shoppingCart[0]).toEqual(
            expect.objectContaining({
                itemId: newProduct.itemId,
                amount: newProduct.amount,
                params: expect.objectContaining({
                    color: "gray",
                    size: "medium",
                }),
            })
        );
    });

    test("Expect adding duplicate item to increment existing in cart", async () => {
        const { newProduct, sessionToken } = getParams();

        await DatabaseMethods.addToCart(newProduct, sessionToken);
        const { shoppingCart } = await DatabaseMethods.getUser(sessionToken);

        expect(shoppingCart.length).toBe(1);
        expect(shoppingCart[0]).toEqual(
            expect.objectContaining({
                itemId: newProduct.itemId,
                amount: 1 + newProduct.amount,
                params: expect.objectContaining({
                    color: "gray",
                    size: "medium",
                }),
            })
        );
    });

    test("Expect adding separate item to push one more thing to cart", async () => {
        const { newProduct, sessionToken } = getParams();
        newProduct.itemId = 2;

        await DatabaseMethods.addToCart(newProduct, sessionToken);

        const { shoppingCart } = await DatabaseMethods.getUser(sessionToken);

        expect(shoppingCart.length).toBe(2);
        expect(shoppingCart[1]).toEqual(
            expect.objectContaining({
                itemId: newProduct.itemId,
                amount: newProduct.amount,
                params: expect.objectContaining({
                    color: "gray",
                    size: "medium",
                }),
            })
        );
    });

    test("Expect removing item to do so, if it exists", async () => {
        await DatabaseMethods.deleteCartItem(0, sessionToken);

        const { shoppingCart } = await DatabaseMethods.getUser(sessionToken);

        expect(shoppingCart[0]).toStrictEqual(
            expect.objectContaining({
                itemId: 2,
                amount: 1,
                params: expect.objectContaining({
                    color: "gray",
                    size: "medium",
                }),
            })
        );
    });

    test("Expect removing final item, to return empty cart", async () => {
        await DatabaseMethods.deleteCartItem(0, sessionToken);

        const { shoppingCart } = await DatabaseMethods.getUser(sessionToken);

        expect(shoppingCart[0]).toBe(undefined);
    });

    test("Expect removing from empty cart, to return empty cart", async () => {
        const response = await DatabaseMethods.deleteCartItem(0, sessionToken);

        const { shoppingCart } = await DatabaseMethods.getUser(sessionToken);

        expect(shoppingCart[0]).toBe(undefined);
    });

    function getParams(override = {}) {
        const defaultParams = {
            sessionToken: "0904437e-95db-4372-82ea-0310812bcf1a",
            newProduct: {
                itemId: 1,
                amount: 1,
                params: {
                    color: "gray",
                    size: "medium",
                },
            },
        };

        const params = { ...defaultParams, ...override };

        return params;
    }
});

describe("User Cart Model", () => {
    beforeAll(connect);
    // beforeEach(cleanData)
    afterAll(disconnect);

    test("Expect getAllUsers to return nothing on empty table", async () => {
        const response = await DatabaseMethods.getAllUsers();

        expect(response).toEqual([]);
    });

    test("Expect createAndReturnUser to return a new User", async () => {
        const payload = getCreds();

        const response = await DatabaseMethods.createAndReturnUser(payload);

        expect(response).toEqual(
            expect.objectContaining({
                __v: expect.anything(),
                _id: expect.anything(),
                username: payload.username,
                password: payload.password,
                loginStatus: "user",
                shoppingCart: [],
            })
        );
    });

    test("Expect getUser to return an existing User", async () => {
        const { username, password } = getCreds();

        const response = await DatabaseMethods.getUser({
            username,
        });

        expect(response).toEqual(
            expect.objectContaining({
                __v: expect.anything(),
                _id: expect.anything(),
                username: username,
                password: password,
                loginStatus: "user",
                shoppingCart: [],
            })
        );
    });

    test("Expect changing password to update existing password", async () => {
        const { username, password } = getCreds();
        const newPassword = "testing";

        await DatabaseMethods.changePassword({
            username,
            password: newPassword,
        });

        const response = await DatabaseMethods.getUser({ username });

        expect(response).toEqual(
            expect.objectContaining({
                __v: expect.anything(),
                _id: expect.anything(),
                username: username,
                password: newPassword,
                loginStatus: "user",
                shoppingCart: [],
            })
        );
    });

    test("Expect adding to empty cart to push 1 item", async () => {
        const { username } = getCreds();
        const { newProduct } = getItem();

        await DatabaseMethods.addToCart(newProduct, {
            username,
        });
        const { shoppingCart } = await DatabaseMethods.getUser({ username });

        expect(shoppingCart.length).toBe(1);
        expect(shoppingCart[0]).toEqual(
            expect.objectContaining({
                itemId: newProduct.itemId,
                amount: newProduct.amount,
                params: expect.objectContaining({
                    color: "gray",
                    size: "medium",
                }),
            })
        );
    });

    // test("Expect adding duplicate item to increment existing in cart", async () => {
    //     const { newProduct, sessionToken } = getParams();

    //     await DatabaseMethods.addToCart(newProduct, sessionToken);
    //     const finalState = (await DatabaseMethods.getUser(sessionToken))
    //         .shoppingCart;

    //     expect(finalState.length).toBe(1);
    //     expect(finalState[0]).toEqual(
    //         expect.objectContaining({
    //             itemId: newProduct.itemId,
    //             amount: 1 + newProduct.amount,
    //             params: expect.objectContaining({
    //                 color: "gray",
    //                 size: "medium",
    //             }),
    //         })
    //     );
    // });

    // test("Expect adding separate item to push one more thing to cart", async () => {
    //     const { newProduct, sessionToken } = getParams();
    //     newProduct.itemId = 2;

    //     await DatabaseMethods.addToCart(newProduct, sessionToken);

    //     const finalState = (await DatabaseMethods.getUser(sessionToken))
    //         .shoppingCart;

    //     expect(finalState.length).toBe(2);
    //     expect(finalState[1]).toEqual(
    //         expect.objectContaining({
    //             itemId: newProduct.itemId,
    //             amount: newProduct.amount,
    //             params: expect.objectContaining({
    //                 color: "gray",
    //                 size: "medium",
    //             }),
    //         })
    //     );
    // });

    // test("Expect adding invalid item to return nothing", async () => {
    //     const newProduct = "blablabla";
    // });

    // test("Expect removing item to do so, if it exists", async () => {
    //     await DatabaseMethods.deleteCartItem(0, sessionToken);

    //     const cart = (await DatabaseMethods.getUser(sessionToken)).shoppingCart;

    //     expect(cart[0]).toStrictEqual(
    //         expect.objectContaining({
    //             itemId: 2,
    //             amount: 1,
    //             params: expect.objectContaining({
    //                 color: "gray",
    //                 size: "medium",
    //             }),
    //         })
    //     );
    // });

    // test("Expect removing final item, to return empty cart", async () => {
    //     await DatabaseMethods.deleteCartItem(0, sessionToken);

    //     const cart = (await DatabaseMethods.getUser(sessionToken)).shoppingCart;

    //     expect(cart[0]).toBe(undefined);
    // });

    // test("Expect removing from empty cart, to return empty cart", async () => {
    //     const response = await DatabaseMethods.deleteCartItem(0, sessionToken);
    //     console.log(response);

    //     const cart = (await DatabaseMethods.getUser(sessionToken)).shoppingCart;

    //     expect(cart[0]).toBe(undefined);
    // });

    function getCreds(override = {}) {
        const defaultParams = {
            username: "abcdefg",
            password: "abcdefg",
        };

        const params = { ...defaultParams, ...override };

        return params;
    }

    function getItem(override = {}) {
        const defaultParams = {
            sessionToken: "0904437e-95db-4372-82ea-0310812bcf1a",
            newProduct: {
                itemId: 1,
                amount: 1,
                params: {
                    color: "gray",
                    size: "medium",
                },
            },
        };

        const params = { ...defaultParams, ...override };

        return params;
    }
});
