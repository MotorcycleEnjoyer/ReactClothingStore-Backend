const express = require("express");
const shoppingCartRouter = require("./routes/api/ShoppingCart");
const searchRouter = require("./routes/api/Search");
const suggestionRouter = require("./routes/api/Suggestions");
const { suggestions } = require("./DummyProductDB");
const path = require("path");

function makeApp(db, sessionsObject = {}) {
    const app = express();
    app.use(express.json());
    app.use(express.static(path.join(__dirname, "build")));

    const sessions = { ...sessionsObject };

    const stockDb = {
        1: 15,
        2: 40,
    };

    app.use("/api/shoppingCart", shoppingCartRouter({ sessions, db, stockDb }));

    app.use("/api/s", searchRouter({ db }));

    app.use("/api/suggestions", suggestionRouter({ suggestions }));

    app.get("/*", (req, res) => {
        res.sendFile(path.join(__dirname, "build", "index.html"));
    });

    return app;
}

module.exports = makeApp;
