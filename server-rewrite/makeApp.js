const express = require("express");
const uuidv4 = require("uuid").v4;
const shoppingCartRouter = require("./routes/api/ShoppingCart");

function makeApp(db, sessionsObject = {}) {
    const app = express();
    app.use(express.json());

    const sessions = { ...sessionsObject };
    const stockDb = {
        1: 15,
        2: 40,
    };

    app.use("/api/shoppingCart", shoppingCartRouter({ sessions, db, stockDb }));
    return app;
}

module.exports = makeApp;
