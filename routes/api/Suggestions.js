const express = require("express");
const { limitedArrayPull } = require("../../utility/helper");

const wrapper = ({ suggestions }) => {
    const router = express.Router();
    router.post("/", function (req, res) {
        const { searchTerm } = req.body;
        if (
            typeof searchTerm !== "string" ||
            searchTerm.length > 50 ||
            searchTerm.length === 0
        ) {
            return res.status(400).send("Invalid Query");
        }
        const searchSuggestions = findSearchSuggestions(searchTerm);
        return res.send(searchSuggestions);
    });

    router.all("/", function (req, res) {
        return res.status(404).send();
    });

    function findSearchSuggestions(searchTerm) {
        let regex = new RegExp(searchTerm, "gi");

        const suggestionResults = Array.from(
            limitedArrayPull(suggestions, (i) => i.match(regex), 10)
        );

        return suggestionResults;
    }

    return router;
};

module.exports = wrapper;
