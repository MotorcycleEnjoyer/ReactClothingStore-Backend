const express = require("express");
const uuidv4 = require("uuid").v4;

const wrapper = ({ sessions, db, stockDb }) => {
    const router = express.Router();

    router.get("/", async (req, res) => {
        const { cookie } = req.headers;

        if (sessionNotFound(cookie)) {
            // returns sessionToken, LoginStatus, ShoppingCart
            const { sessionToken, shoppingCart, loginStatus } =
                await makeSessionAndUser();
            res.cookie(sessionToken, {
                httpOnly: true,
                secure: true,
                sameSite: "lax",
            });
            return res.send({ shoppingCart, loginStatus });
        }

        const { shoppingCart, loginStatus } = await db.getUser(cookie);
        res.send({ shoppingCart, loginStatus });
    });

    router.post("/", async (req, res) => {
        const { cookie } = req.headers;
        const { itemId, amount, params } = req.body;

        if (typeof itemId !== "number" || itemId < 0 || itemId > 10000) {
            return res.status(400).send("No item to append!");
        }

        if (typeof amount !== "number" || amount <= 0 || amount > 100) {
            return res.status(400).send("Invalid amount");
        }

        if (!params || !params.color || !params.size) {
            return res.status(400).send("Invalid params");
        }

        let cartId = cookie;
        if (sessionNotFound(cartId)) {
            cartId = uuidv4();
            sessions[cartId] = { type: "anon" };
            const person = await db.createAndReturnUser({
                sessionToken: cartId,
            });
            res.cookie(cartId, {
                httpOnly: true,
                secure: true,
                sameSite: "lax",
            });
        }

        if (validateParams(params)) {
            if (itemIsInStock({ itemId, amount, params })) {
                await db.addToCart({ itemId, amount, params }, cartId);
            } else {
                return res.status(500).json("Not enough item in stock!");
            }
        } else {
            return res.status(400).json("Invalid parameters");
        }
        const { shoppingCart, loginStatus } = await db.getUser(cartId);
        res.send({ shoppingCart, loginStatus });
    });

    router.put("/", async (req, res) => {
        const { cookie } = req.headers;
        const { indexInCart, newAmount, itemId } = req.body;

        if (typeof indexInCart !== "number") {
            return res.status(400).send("Invalid Index.");
        }

        if (typeof newAmount !== "number" || newAmount < 0 || newAmount > 100) {
            return res.status(400).send("Invalid new amount.");
        }

        if (sessionNotFound(cookie)) {
            return res.status(400).send("Invalid cookie");
        }

        if (indexInCart < 0 || indexInCart >= 100) {
            return res.status(400).send("Invalid index.");
        }

        if (typeof itemId !== "number" || itemId < 0 || itemId > 10000) {
            return res.status(400).send("No item to append!");
        }

        if (itemIsInStock({ itemId, amount: newAmount })) {
            const { shoppingCart, loginStatus } = await db.editCartItem(
                { indexInCart, newAmount },
                cookie
            );
            const person = await db.getUser(cookie);
            console.log(person.shoppingCart);
            return res.send({ shoppingCart, loginStatus });
        } else {
            res.status(500).send("Not enough item in stock!");
        }
    });

    router.delete("/", async (req, res) => {
        const { cookie } = req.headers;
        const { indexInCart } = req.body;

        if (
            typeof indexInCart !== "number" ||
            indexInCart < 0 ||
            indexInCart > 100
        ) {
            return res.status(400).send("Invalid Index.");
        }

        if (sessionNotFound(cookie)) {
            return res.status(400).send("Invalid cookie");
        }

        if (indexInCart < 0 || indexInCart >= 100) {
            return res.status(400).send("Invalid index.");
        }

        const { shoppingCart, loginStatus } = await db.deleteCartItem(
            indexInCart,
            cookie
        );
        res.send({ shoppingCart, loginStatus });
    });

    function validateParams(params) {
        const { color, size } = params;
        const allowedSizes = ["small", "medium", "large", "extraLarge"];
        const allowedColors = ["gray", "black", "white"];
        if (typeof size !== "string" || !allowedSizes.includes(size)) {
            return false;
        }

        if (typeof color !== "string" || !allowedColors.includes(color)) {
            return false;
        }

        return true;
    }

    function getStock(itemId) {
        // TODO
        // Check stock of an item, of given config (ex: COLOR)

        return stockDb[itemId];
    }

    function itemIsInStock(object) {
        const amountInStock = getStock(object.itemId);
        if (object.amount > amountInStock) {
            return false;
        }

        return true;
    }

    function sessionNotFound(cookie) {
        return sessions[cookie] === undefined;
    }

    async function makeSessionAndUser() {
        const sessionToken = uuidv4();
        sessions[sessionToken] = { type: "anon" };
        const { shoppingCart, loginStatus } = await db.createAndReturnUser({
            sessionToken,
        });
        return { sessionToken, shoppingCart, loginStatus };
    }

    return router;
};

module.exports = wrapper;
