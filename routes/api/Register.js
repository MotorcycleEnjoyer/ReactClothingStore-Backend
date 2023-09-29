const express = require("express");
const bcrypt = require("bcrypt");
const uuidv4 = require("uuid").v4;

const wrapper = ({ sessions, db }) => {
    const router = express.Router();
    router.post("/", async (req, res) => {
        const { cookie } = req.headers;
        const { username, password, confirmPassword } = req.body;

        const sessionId = getSession(cookie);

        if (!sessionId) {
            return res.status(401).send("Invalid cookie.");
        }
        if (isLoggedIn(sessionId)) {
            return res.status(403).send("Already logged in!");
        }
        if (!validateCredentials(username) || !validateCredentials(password)) {
            return res.status(400).send("Invalid credentials.");
        }
        if (password !== confirmPassword) {
            return res.status(400).send("Passwords do not match.");
        }
        const nameIsAvailable = (await db.getUser({ username })) === null;

        if (nameIsAvailable) {
            bcrypt.genSalt(12, async function (err, salt) {
                if (err) {
                    console.log(err);
                    return res.status(500).send("Error creating account.");
                }
                bcrypt.hash(password, salt, async function (err, hash) {
                    if (err) {
                        return res.status(500).send("Error creating account.");
                    }
                    const newSessionToken = uuidv4();
                    await db.createAndReturnUser({
                        username: username,
                        password: hash,
                    });
                    await db.deleteGuest(sessionId);
                    const newUser = await db.getUser({ username });
                    sessions[newSessionToken] = {
                        type: "user",
                        username: newUser.username,
                    };
                    delete sessions[sessionId];
                    let csrfToken = uuidv4();
                    sessions[newSessionToken].csrfToken = csrfToken;
                    // saveSessions();
                    res.cookie("session", `${newSessionToken}`, {
                        httpOnly: true,
                        secure: true,
                        sameSite: "lax",
                    });
                    return res.status(200).send({ csrfToken });
                });
            });
        } else {
            return res.status(409).send("Username is taken.");
        }
    });

    router.all("/", (req, res) => {
        return res.status(404).send();
    });

    function isLoggedIn(sessionId) {
        return sessions[sessionId].type === "user";
    }

    function validateCredentials(cred) {
        if (typeof cred !== "string" || cred.length >= 30 || cred.length <= 5) {
            return false;
        }

        return true;
    }

    function getSession(cookie) {
        if (typeof cookie !== "string") {
            console.log("COOKIE NOT FOUND");
            return undefined;
        }
        const sessionId = cookie.split("=")[1];
        const userSession = sessions[sessionId];
        if (!userSession) {
            console.log("USER SESSION NOT FOUND");
            return undefined;
        }
        return sessionId;
    }

    return router;
};

module.exports = wrapper;
