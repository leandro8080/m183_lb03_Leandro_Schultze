const { initializeDatabase, queryDB, insertDB } = require("./database");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
require("dotenv").config();
const bcrypt = require("bcrypt");
const AesEncryption = require("aes-encryption");

let db;
const aes = new AesEncryption();
aes.setSecretKey(process.env.AESSECRETKEY);
const secretKey = process.env.SECRETKEY;

const initializeAPI = async (app) => {
    db = await initializeDatabase();
    app.get("/api/feed", getFeed);
    app.post("/api/feed", body("username").escape(), body("timestamp").escape(), body("text").notEmpty().withMessage("Text is empty").escape(), postTweet);
    app.post("/api/login", body("username").escape(), login);
    app.get("/api/verify-token", verifyToken);
};

const getFeed = async (req, res) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return res.sendStatus(401);
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.sendStatus(401);
    }
    jwt.verify(token, secretKey, async (err) => {
        if (err) {
            return res.sendStatus(401);
        }
        const query = "SELECT * FROM tweets ORDER BY id DESC";
        const tweets = await queryDB(db, query);
        for (i = 0; i < tweets.length; i++) {
            tweets[i].username = aes.decrypt(tweets[i].username);
            tweets[i].timestamp = aes.decrypt(tweets[i].timestamp);
            tweets[i].text = aes.decrypt(tweets[i].text);
        }
        res.json(tweets);
    });
};

const postTweet = (req, res) => {
    const result = validationResult(req);
    if (result.errors.length > 0) {
        return res.sendStatus(400);
    }
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return res.sendStatus(401);
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.sendStatus(401);
    }
    jwt.verify(token, secretKey, async (err, decoded) => {
        if (err) {
            return res.sendStatus(401);
        }

        const { username } = decoded.data;
        const { timestamp, text } = req.body;

        const encryptedUsername = aes.encrypt(username);
        const encryptedTimestamp = aes.encrypt(timestamp);
        const encryptedText = aes.encrypt(text);
        const query = `INSERT INTO tweets (username, timestamp, text) VALUES ('${encryptedUsername}', '${encryptedTimestamp}', '${encryptedText}')`;
        insertDB(db, query);
        res.json({ status: "ok" });
    });
};

const login = async (req, res) => {
    const { username, password } = req.body;
    const query = `SELECT password FROM users WHERE username = "${username}";`;
    const user = await queryDB(db, query);
    if (user.length === 1) {
        const hashedPassword = user[0].password;
        const match = await bcrypt.compare(password, hashedPassword);
        if (match) {
            const token = jwt.sign(
                {
                    exp: Math.floor(Date.now() / 1000) + 60 * 60,
                    data: { username },
                },
                secretKey
            );
            res.status(200).send(token);
        } else {
            res.status(401).send("Username or password wrong");
        }
    } else {
        res.status(401).send("Username or password wrong");
    }
};

const verifyToken = async (req, res) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return res.sendStatus(401);
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.sendStatus(401);
    }
    jwt.verify(token, secretKey, async (err) => {
        if (err) {
            return res.sendStatus(401);
        }

        return res.status(200);
    });
};

module.exports = { initializeAPI };
