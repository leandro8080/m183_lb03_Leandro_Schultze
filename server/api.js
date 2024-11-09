const { initializeDatabase, queryDB, insertDB } = require("./database");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const bcrypt = require("bcrypt");

let db;
const secretKey = process.env.SECRETKEY;

const initializeAPI = async (app) => {
    db = await initializeDatabase();
    app.get("/api/feed", getFeed);
    app.post("/api/feed", postTweet);
    app.post("/api/login", login);
    app.get("/api/verify-token", verifyToken);
    app.post("/api/hash-password", hashPassword);
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
        res.json(tweets);
    });
};

const postTweet = (req, res) => {
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
        const query = `INSERT INTO tweets (username, timestamp, text) VALUES ('${username}', '${timestamp}', '${text}')`;
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

// This function is only for "testing" so I can generate a hashed password for testing the login
const hashPassword = async (req, res) => {
    const password = req.body.password;
    const saltRounds = 10;
    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
            return res.sendStatus(500);
        }

        res.status(200).send(hash);
    });
};

module.exports = { initializeAPI };
