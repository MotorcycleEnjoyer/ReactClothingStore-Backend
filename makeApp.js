const express = require("express");
const shoppingCartRouter = require("./routes/api/ShoppingCart");
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

    app.get("/*", (req, res) => {
        console.log("/ path");
        res.sendFile(path.join(__dirname, "build", "index.html"));
    });

    return app;
}

module.exports = makeApp;
