const express = require("express");

const wrapper = ({ db }) => {
    const router = express.Router();
    router.get("/", async (req, res) => {
        const { k } = req.query;

        if (typeof k !== "string" || k.length === 0 || k.length > 50) {
            return res.status(400).send("Invalid search");
        }

        // pull objects from the database

        const response = await db.searchAndReturnProducts(k);

        res.send(response);
    });

    return router;
};

module.exports = wrapper;
