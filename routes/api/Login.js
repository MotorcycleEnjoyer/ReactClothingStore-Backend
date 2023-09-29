const express = require("express");
const bcrypt = require("bcrypt");
const uuidv4 = require("uuid").v4;

const wrapper = ({ sessions, db }) => {
    const router = express.Router();
    router.post("/", async (req, res) => {
        const { cookie } = req.headers;
        const { username, password } = req.body;

        const sessionId = getSession(cookie);

        if (!sessionId) {
            return res.status(401).send("Invalid cookie.");
        }
        if (isLoggedIn(sessionId)) {
            return res.status(403).send("Already Logged In...");
        }
        if (!validateCredentials(username) || !validateCredentials(password)) {
            return res.status(400).send("Invalid Credentials.");
        }
        const credentialsFoundInMongoDB = await db.getUser({
            username,
        });
        if (!credentialsFoundInMongoDB) {
            return res.status(400).send("Login Error");
        }
        const comparisonPassword = credentialsFoundInMongoDB.password;
        bcrypt.compare(password, comparisonPassword, async (err, result) => {
            if (err) {
                console.log(err);
                return;
            }
            if (result) {
                const sessionsArr = Object.keys(sessions);
                const userSessionIndex = sessionsArr.findIndex((item) => {
                    if (item.username !== undefined) {
                        if (item.username === username) {
                            return item;
                        }
                    }
                });
                const isAlreadyLoggedIn = userSessionIndex !== -1;
                if (isAlreadyLoggedIn) {
                    return res.status(403).send("Already logged in!");
                }
                const newSessionToken = uuidv4();
                sessions[newSessionToken] = {
                    type: "user",
                    username: username,
                };
                delete sessions[sessionId];
                await db.deleteGuest(sessionId);
                let csrfToken = uuidv4();
                sessions[newSessionToken].csrfToken = csrfToken;
                // saveSessions();
                res.cookie("session", `${newSessionToken}`, {
                    httpOnly: true,
                    secure: true,
                    sameSite: "lax",
                });
                return res.status(200).send({ csrfToken });
            } else {
                console.log("POST/login: bad creds BECAUSE BCRYPT FAILED");
                return res
                    .status(400)
                    .send("Incorrect credentials. Please try again");
            }
        });
    });

    router.all("/", function (req, res) {
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
